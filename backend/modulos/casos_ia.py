import json
import re
import uuid
from typing import Literal

import ollama
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError, field_validator

from base_datos.database import get_connection

router = APIRouter()

SONIDOS_VALIDOS = {
    "normal",
    "crepitantes",
    "sibilancias",
    "roncus",
    "frote_pleural",
    "normal_cardiaco",
    "soplo_sistolico",
    "s3",
}

DIFICULTADES = {
    "facil": "Cuadro típico, pocos antecedentes y una ruta diagnóstica clara.",
    "medio": "Cuadro con variaciones clínicas, algún antecedente relevante y diferenciales razonables.",
    "dificil": "Presentación menos evidente, varios datos que integrar y diagnósticos diferenciales plausibles, sin datos contradictorios.",
}


class SolicitudCaso(BaseModel):
    dificultad: Literal["facil", "medio", "dificil"]


class SignosVitales(BaseModel):
    frecuencia_cardiaca: int = Field(ge=35, le=200)
    frecuencia_respiratoria: int = Field(ge=6, le=50)
    saturacion_oxigeno: int = Field(ge=50, le=100)
    temperatura: float = Field(ge=34, le=42)
    presion_arterial: str = Field(
        min_length=5,
        max_length=20,
        pattern=r"^\d{2,3}/\d{2,3}\s?mmHg$",
    )

    @field_validator("presion_arterial")
    @classmethod
    def validar_presion_arterial(cls, valor):
        sistolica, diastolica = (
            int(presion)
            for presion in valor.replace("mmHg", "").split("/")
        )
        if not (60 <= sistolica <= 260 and 30 <= diastolica <= 160 and sistolica > diastolica):
            raise ValueError("La presión arterial debe ser fisiológicamente plausible.")
        return valor


class CasoGenerado(BaseModel):
    titulo: str = Field(min_length=8, max_length=150)
    patologia: str = Field(min_length=3, max_length=120)
    descripcion: str = Field(min_length=50, max_length=3000)
    sistema: Literal[
        "respiratorio",
        "cardiovascular",
        "digestivo",
        "neurologico",
        "renal",
        "endocrino",
        "hematologico",
        "infeccioso",
    ]
    signos_vitales: SignosVitales
    hallazgos_exploracion: str = Field(min_length=20, max_length=1500)
    estudio_nombre: str = Field(min_length=3, max_length=100)
    estudio_resultado: str = Field(min_length=10, max_length=1500)
    auscultacion_id: str
    diagnosticos_aceptados: list[str] = Field(min_length=1, max_length=6)

    @field_validator("descripcion", mode="before")
    @classmethod
    def convertir_descripcion_a_texto(cls, valor):
        if isinstance(valor, dict):
            return "; ".join(
                f"{clave.replace('_', ' ')}: {contenido}"
                for clave, contenido in valor.items()
                if contenido is not None
            )
        return valor

    @field_validator("sistema", mode="before")
    @classmethod
    def normalizar_sistema(cls, valor):
        import unicodedata

        texto = unicodedata.normalize("NFKD", str(valor).strip().lower())
        texto = "".join(caracter for caracter in texto if not unicodedata.combining(caracter))
        alias = {
            "neumologico": "respiratorio",
            "pulmonar": "respiratorio",
            "cardiaco": "cardiovascular",
            "gastrointestinal": "digestivo",
            "neurologico": "neurologico",
            "hematologico": "hematologico",
            "infeccioso": "infeccioso",
            "endocrino": "endocrino",
            "renal": "renal",
        }
        return alias.get(texto, texto)


def _crear_tabla(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS casos_ia (
            id VARCHAR(40) PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            patologia VARCHAR(255) NOT NULL,
            dificultad VARCHAR(20) NOT NULL,
            descripcion TEXT NOT NULL,
            datos_clinicos TEXT NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)


def _normalizar(texto):
    import unicodedata

    texto = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in texto if not unicodedata.combining(c))


def _diagnosticos_existentes():
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        _crear_tabla(cursor)
        cursor.execute("SELECT titulo, patologia FROM casos_clinicos")
        existentes = cursor.fetchall()
        cursor.execute("SELECT patologia, datos_clinicos FROM casos_ia")
        for fila in cursor.fetchall():
            existentes.append({"patologia": fila["patologia"]})
            datos_clinicos = json.loads(fila["datos_clinicos"])
            existentes.extend(
                {"patologia": sinonimo}
                for sinonimo in datos_clinicos.get("diagnosticos_aceptados", [])
            )
        conn.commit()
        return sorted({
            fila[campo]
            for fila in existentes
            for campo in ("titulo", "patologia")
            if fila.get(campo)
        })
    finally:
        conn.close()


def _es_patologia_repetida(patologia, existentes):
    nueva = _normalizar(patologia)
    return any(
        nueva == _normalizar(nombre)
        or nueva in _normalizar(nombre)
        or _normalizar(nombre) in nueva
        for nombre in existentes
    )


def _generar_desde_ia(dificultad, existentes):
    exclusiones = "\n".join(f"- {nombre}" for nombre in existentes)
    variacion = uuid.uuid4().hex
    prompt = f"""Genera un caso clínico NUEVO para una simulación educativa OSCE en español.
Variación aleatoria de esta solicitud: {variacion}
No reutilices, parafrasees ni adaptes historias de otros casos. No uses ninguna de estas patologías ni variantes sinonímicas:
{exclusiones}

Elige aleatoriamente una enfermedad de cualquier sistema clínico (respiratorio, cardiovascular, digestivo, neurológico, renal, endocrino, hematológico o infeccioso), evitando los diagnósticos excluidos. La simulación incluye anamnesis, hallazgos de exploración, un estudio complementario apropiado y auscultación.
Dificultad: {dificultad}. {DIFICULTADES[dificultad]}
Usa una enfermedad reconocida y clínicamente documentada. No inventes enfermedades, asociaciones, hallazgos ni valores; los síntomas, signos vitales, exploración, auscultación y resultado del estudio deben ser coherentes entre sí y con la enfermedad.
La descripcion contiene únicamente información que un paciente podría relatar si se le pregunta; no reveles el nombre de la patología ni hallazgos que el paciente no conoce. Incluye edad, sexo, ocupación, motivo, inicio, evolución, síntomas asociados, antecedentes, medicamentos y alergias pertinentes, pero el paciente solo revelará cada dato si se le pregunta.
El estudio debe ser apropiado para el sistema y el caso (por ejemplo ECG, radiografía, ecografía o laboratorio) y el resultado debe apoyar el razonamiento diagnóstico sin revelar la respuesta de forma explícita. Si la enfermedad no afecta la auscultación cardiopulmonar, usa auscultacion_id "normal" o "normal_cardiaco" y no atribuyas hallazgos anormales a esos sonidos.
diagnosticos_aceptados debe incluir el nombre exacto de la patología y hasta cinco sinónimos clínicos válidos.
auscultacion_id debe ser exactamente uno de: {", ".join(sorted(SONIDOS_VALIDOS))}.
Retorna exclusivamente un objeto JSON con estas claves y formatos:
{{
  "titulo": "título neutral que no revele el diagnóstico",
  "patologia": "diagnóstico clínico esperado",
  "descripcion": "historia del paciente en tercera persona",
  "sistema": "respiratorio, cardiovascular, digestivo, neurologico, renal, endocrino, hematologico o infeccioso",
  "signos_vitales": {{
    "frecuencia_cardiaca": 80,
    "frecuencia_respiratoria": 16,
    "saturacion_oxigeno": 98,
    "temperatura": 36.8,
    "presion_arterial": "120/80 mmHg"
  }},
  "hallazgos_exploracion": "hallazgos físicos coherentes",
  "estudio_nombre": "nombre del estudio",
  "estudio_resultado": "resultado específico y coherente",
  "auscultacion_id": "un identificador permitido",
  "diagnosticos_aceptados": ["diagnóstico", "sinónimo"]
}}
"""
    respuesta = ollama.chat(
        model="llama3.1",
        messages=[
            {
                "role": "system",
                "content": "Eres un médico docente. Prioriza la coherencia clínica y la seguridad educativa. Sigue estrictamente el esquema JSON solicitado.",
            },
            {"role": "user", "content": prompt},
        ],
        format="json",
        options={"temperature": 0.9, "top_p": 0.95},
    )
    contenido = respuesta["message"]["content"]
    caso = CasoGenerado.model_validate(json.loads(contenido))
    if caso.auscultacion_id not in SONIDOS_VALIDOS:
        raise ValueError("La IA devolvió un identificador de auscultación no permitido.")
    if _es_patologia_repetida(caso.patologia, existentes):
        raise ValueError("La IA repitió una patología que ya existe.")
    if any(
        _es_patologia_repetida(sinonimo, existentes)
        for sinonimo in caso.diagnosticos_aceptados
    ):
        raise ValueError("La IA propuso un sinónimo de una patología que ya existe.")
    if not any(
        _normalizar(caso.patologia) == _normalizar(nombre)
        for nombre in caso.diagnosticos_aceptados
    ):
        raise ValueError("El diagnóstico esperado debe aparecer entre las respuestas aceptadas.")
    if any(
        _normalizar(nombre) in _normalizar(caso.titulo)
        for nombre in caso.diagnosticos_aceptados
    ):
        raise ValueError("El título no debe revelar el diagnóstico.")
    if _normalizar(caso.patologia) in _normalizar(caso.descripcion):
        raise ValueError("La historia del paciente no debe revelar el diagnóstico.")
    if _normalizar(caso.patologia) in _normalizar(caso.estudio_resultado):
        raise ValueError("El estudio no debe revelar explícitamente el diagnóstico.")
    return caso


def obtener_caso_ia(caso_id):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        _crear_tabla(cursor)
        cursor.execute(
            "SELECT * FROM casos_ia WHERE id = %s",
            (caso_id,),
        )
        caso = cursor.fetchone()
        if caso:
            caso["datos_clinicos"] = json.loads(caso["datos_clinicos"])
        return caso
    finally:
        conn.close()


@router.post("/generar")
def generar_caso(data: SolicitudCaso):
    try:
        existentes = _diagnosticos_existentes()
        caso = None
        for _ in range(8):
            try:
                caso = _generar_desde_ia(data.dificultad, existentes)
                break
            except (ValueError, ValidationError, json.JSONDecodeError) as error:
                print(f"Generación de caso IA inválida; se reintentará: {error}")
        if caso is None:
            return JSONResponse(
                status_code=502,
                content={"error": "La IA no pudo generar un caso clínico válido y diferente. Inténtalo de nuevo."},
            )

        caso_id = f"ia_{uuid.uuid4().hex}"
        datos_clinicos = caso.model_dump(
            exclude={"titulo", "patologia", "descripcion"}
        )
        conn = get_connection()
        try:
            cursor = conn.cursor()
            _crear_tabla(cursor)
            cursor.execute(
                """
                INSERT INTO casos_ia (id, titulo, patologia, dificultad, descripcion, datos_clinicos)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    caso_id,
                    caso.titulo,
                    caso.patologia,
                    data.dificultad,
                    caso.descripcion,
                    json.dumps(datos_clinicos, ensure_ascii=False),
                ),
            )
            conn.commit()
        finally:
            conn.close()

        return {
            "estado": "ok",
            "caso": {"id": caso_id, "titulo": caso.titulo, "dificultad": data.dificultad},
        }
    except Exception as error:
        print(f"Error generando caso clínico con IA: {error}")
        return JSONResponse(
            status_code=503,
            content={"error": "No se pudo generar el caso. Comprueba que Ollama y la base de datos estén disponibles."},
        )


@router.get("/{caso_id}")
def detalle_caso_ia(caso_id: str):
    if not re.fullmatch(r"ia_[a-f0-9]{32}", caso_id):
        return JSONResponse(status_code=404, content={"error": "Caso generado no encontrado"})
    try:
        caso = obtener_caso_ia(caso_id)
        if not caso:
            return JSONResponse(status_code=404, content={"error": "Caso generado no encontrado"})
        datos_clinicos = {
            clave: valor
            for clave, valor in caso["datos_clinicos"].items()
            if clave != "diagnosticos_aceptados"
        }
        return {
            "estado": "ok",
            "caso": {
                "id": caso["id"],
                "titulo": caso["titulo"],
                "dificultad": caso["dificultad"],
                "descripcion": caso["descripcion"],
                "datos_clinicos": datos_clinicos,
            },
        }
    except Exception as error:
        print(f"Error cargando caso clínico generado: {error}")
        return JSONResponse(
            status_code=503,
            content={"error": "No se pudo cargar el caso generado."},
        )
