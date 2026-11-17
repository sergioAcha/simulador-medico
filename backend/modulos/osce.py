from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
from base_datos.database import get_connection

router = APIRouter()

# Criterios de evaluación por módulo
CRITERIOS = {
    "anamnesis": [
        {"id": "a1", "descripcion": "Saluda y se presenta correctamente", "puntaje": 5},
        {"id": "a2", "descripcion": "Pregunta motivo de consulta principal", "puntaje": 10},
        {"id": "a3", "descripcion": "Investiga inicio y duración de síntomas", "puntaje": 10},
        {"id": "a4", "descripcion": "Pregunta factores que agravan o alivian", "puntaje": 10},
        {"id": "a5", "descripcion": "Investiga antecedentes personales", "puntaje": 10},
        {"id": "a6", "descripcion": "Pregunta antecedentes familiares", "puntaje": 5},
        {"id": "a7", "descripcion": "Investiga medicamentos actuales", "puntaje": 5},
        {"id": "a8", "descripcion": "Pregunta alergias", "puntaje": 5},
    ],
    "diagnostico": [
        {"id": "d1", "descripcion": "Identifica correctamente la patología principal", "puntaje": 20},
        {"id": "d2", "descripcion": "Interpreta correctamente la radiografía", "puntaje": 15},
        {"id": "d3", "descripcion": "Menciona diagnósticos diferenciales", "puntaje": 10},
        {"id": "d4", "descripcion": "Solicita exámenes complementarios adecuados", "puntaje": 10},
    ],
    "auscultacion": [
        {"id": "au1", "descripcion": "Identifica correctamente el ruido pulmonar", "puntaje": 15},
        {"id": "au2", "descripcion": "Asocia el ruido con la patología correcta", "puntaje": 15},
        {"id": "au3", "descripcion": "Describe las características del ruido", "puntaje": 10},
    ]
}

sesiones_activas = {}

class IniciarSesion(BaseModel):
    usuario_id: int
    caso_id: str

class ActualizarPuntaje(BaseModel):
    sesion_id: str
    criterios_cumplidos: list[str]

class FinalizarSesion(BaseModel):
    sesion_id: str
    criterios_cumplidos: list[str] = []

@router.post("/iniciar")
def iniciar_sesion(data: IniciarSesion):
    sesion_id = f"{data.usuario_id}_{data.caso_id}_{datetime.now().timestamp()}"

    sesiones_activas[sesion_id] = {
        "usuario_id": data.usuario_id,
        "caso_id": data.caso_id,
        "inicio": datetime.now().isoformat(),
        "puntaje": 0,
        "criterios_cumplidos": [],
        "tiempo_segundos": 0,
        "completado": False
    }

    return {
        "estado": "ok",
        "sesion_id": sesion_id,
        "criterios": CRITERIOS,
        "puntaje_maximo": sum(
            c["puntaje"]
            for modulo in CRITERIOS.values()
            for c in modulo
        )
    }

@router.post("/actualizar")
def actualizar_puntaje(data: ActualizarPuntaje):
    if data.sesion_id not in sesiones_activas:
        return JSONResponse(status_code=404, content={"error": "Sesión no encontrada"})

    sesion = sesiones_activas[data.sesion_id]
    puntaje_total = 0
    criterios_cumplidos = []

    for modulo in CRITERIOS.values():
        for criterio in modulo:
            if criterio["id"] in data.criterios_cumplidos:
                puntaje_total += criterio["puntaje"]
                criterios_cumplidos.append(criterio["id"])

    sesion["puntaje"] = puntaje_total
    sesion["criterios_cumplidos"] = criterios_cumplidos

    return {
        "estado": "ok",
        "puntaje": puntaje_total,
        "criterios_cumplidos": criterios_cumplidos
    }

@router.post("/finalizar")
def finalizar_sesion(data: FinalizarSesion):
    if data.sesion_id not in sesiones_activas:
        return JSONResponse(status_code=404, content={"error": "Sesión no encontrada"})

    sesion = sesiones_activas[data.sesion_id]
    sesion["completado"] = True
    if data.criterios_cumplidos:
        puntaje_total = 0
        criterios_cumplidos = []
        for modulo in CRITERIOS.values():
            for criterio in modulo:
                if criterio["id"] in data.criterios_cumplidos:
                    puntaje_total += criterio["puntaje"]
                    criterios_cumplidos.append(criterio["id"])
        sesion["puntaje"] = puntaje_total
        sesion["criterios_cumplidos"] = criterios_cumplidos

    fin = datetime.now()
    inicio = datetime.fromisoformat(sesion["inicio"])
    sesion["tiempo_segundos"] = int((fin - inicio).total_seconds())

    puntaje_maximo = sum(
        c["puntaje"]
        for modulo in CRITERIOS.values()
        for c in modulo
    )
    porcentaje = round((sesion["puntaje"] / puntaje_maximo) * 100, 2)

    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO sesiones_osce (usuario_id, caso_id, puntaje, tiempo_segundos, completado)
            VALUES (%s, %s, %s, %s, 1)
        """, (sesion["usuario_id"], sesion["caso_id"], sesion["puntaje"], sesion["tiempo_segundos"]))
        sesion_osce_id = cursor.lastrowid
        
        # Guardar criterios de evaluación
        for modulo_nombre, criterios in CRITERIOS.items():
            for criterio in criterios:
                cumplido = 1 if criterio["id"] in sesion["criterios_cumplidos"] else 0
                cursor.execute("""
                    INSERT INTO criterios_evaluacion (sesion_osce_id, criterio_id, modulo, descripcion, puntaje, cumplido)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (sesion_osce_id, criterio["id"], modulo_nombre, criterio["descripcion"], criterio["puntaje"], cumplido))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error guardando sesión: {e}")

    return {
        "estado": "ok",
        "resumen": {
            "puntaje_obtenido": sesion["puntaje"],
            "puntaje_maximo": puntaje_maximo,
            "porcentaje": porcentaje,
            "tiempo_segundos": sesion["tiempo_segundos"],
            "criterios_cumplidos": sesion["criterios_cumplidos"],
            "aprobado": porcentaje >= 60
        }
    }

@router.get("/historial/{usuario_id}")
def historial_usuario(usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM sesiones_osce
            WHERE usuario_id = %s
            ORDER BY fecha DESC
            LIMIT 10
        """, (usuario_id,))
        sesiones = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"estado": "ok", "sesiones": sesiones}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/criterios")
def obtener_criterios():
    return {"criterios": CRITERIOS}
