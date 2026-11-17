from fastapi import APIRouter
from fastapi.responses import JSONResponse
import os
from modulos.casos_ia import obtener_caso_ia

router = APIRouter()

# Biblioteca de sonidos por patología
SONIDOS = {
    "normal": {
        "nombre": "Ruido vesicular normal",
        "descripcion": "Sonido suave y de baja frecuencia escuchado en campos pulmonares normales.",
        "archivo": "normal.mp3",
        "tipo": "pulmonar",
        "caracteristicas": [
            "Suave y de baja intensidad",
            "Mayor en inspiración que espiración",
            "Se escucha en toda la superficie pulmonar"
        ]
    },
    "crepitantes": {
        "nombre": "Crepitantes finos",
        "descripcion": "Sonidos discontinuos, cortos y explosivos. Asociados a neumonía y fibrosis.",
        "archivo": "crepitantes.mp3",
        "tipo": "pulmonar",
        "caracteristicas": [
            "Discontinuos y de alta frecuencia",
            "Predominan en inspiración",
            "Similares al sonido de frotar cabello entre dedos"
        ]
    },
    "sibilancias": {
        "nombre": "Sibilancias",
        "descripcion": "Sonidos continuos, musicales y agudos. Asociados a asma y obstrucción bronquial.",
        "archivo": "sibilancias.mp3",
        "tipo": "pulmonar",
        "caracteristicas": [
            "Continuos y de alta frecuencia",
            "Presentes en inspiración y espiración",
            "Sonido silbante musical"
        ]
    },
    "roncus": {
        "nombre": "Roncus",
        "descripcion": "Sonidos continuos, graves y de baja frecuencia. Asociados a secreciones en bronquios.",
        "archivo": "roncus.mp3",
        "tipo": "pulmonar",
        "caracteristicas": [
            "Continuos y de baja frecuencia",
            "Pueden cambiar con la tos",
            "Sonido grave y ronco"
        ]
    },
    "frote_pleural": {
        "nombre": "Frote pleural",
        "descripcion": "Sonido de roce entre las pleuras inflamadas. Asociado a pleuritis.",
        "archivo": "frote_pleural.mp3",
        "tipo": "pulmonar",
        "caracteristicas": [
            "Discontinuo y superficial",
            "Similar al sonido de cuero frotándose",
            "Presente en inspiración y espiración"
        ]
    },
    "normal_cardiaco": {
        "nombre": "Ruidos cardíacos normales (S1/S2)",
        "descripcion": "Lub-dub normal. S1 cierre de válvulas mitral y tricúspide, S2 cierre de aórtica y pulmonar.",
        "archivo": "normal_cardiaco.mp3",
        "tipo": "cardiaco",
        "caracteristicas": [
            "S1 más fuerte en apex",
            "S2 más fuerte en base",
            "Ritmo regular"
        ]
    },
    "soplo_sistolico": {
        "nombre": "Soplo sistólico",
        "descripcion": "Ruido anormal entre S1 y S2. Asociado a estenosis aórtica o insuficiencia mitral.",
        "archivo": "soplo_sistolico.mp3",
        "tipo": "cardiaco",
        "caracteristicas": [
            "Ocurre entre S1 y S2",
            "Puede ser eyectivo o regurgitante",
            "Intensidad variable según patología"
        ]
    },
    "s3": {
        "nombre": "Tercer ruido cardíaco (S3)",
        "descripcion": "Galope ventricular. Asociado a insuficiencia cardíaca y sobrecarga de volumen.",
        "archivo": "s3.mp3",
        "tipo": "cardiaco",
        "caracteristicas": [
            "Ocurre después de S2",
            "Tono bajo y sordo",
            "Signo de insuficiencia cardíaca"
        ]
    }
}

@router.get("/sonidos")
def listar_sonidos():
    resultado = []
    for key, val in SONIDOS.items():
        resultado.append({
            "id": key,
            "nombre": val["nombre"],
            "descripcion": val["descripcion"],
            "tipo": val["tipo"],
            "caracteristicas": val["caracteristicas"],
            "archivo": val["archivo"]
        })
    return {"sonidos": resultado}

@router.get("/sonidos/{tipo}")
def sonidos_por_tipo(tipo: str):
    if tipo not in ["pulmonar", "cardiaco"]:
        return JSONResponse(status_code=400, content={"error": "Tipo debe ser 'pulmonar' o 'cardiaco'"})

    filtrados = {
        k: v for k, v in SONIDOS.items() if v["tipo"] == tipo
    }

    return {"tipo": tipo, "sonidos": filtrados}

@router.get("/info/{sonido_id}")
def info_sonido(sonido_id: str):
    if sonido_id not in SONIDOS:
        return JSONResponse(status_code=404, content={"error": "Sonido no encontrado"})

    return {"estado": "ok", "sonido": SONIDOS[sonido_id]}

@router.get("/caso/{patologia}")
def sonidos_por_patologia(patologia: str):
    if patologia.startswith("ia_"):
        try:
            caso = obtener_caso_ia(patologia)
        except Exception as e:
            print(f"Error cargando auscultación del caso generado: {e}")
            return JSONResponse(status_code=503, content={"error": "No se pudo cargar la auscultación del caso"})
        if not caso:
            return JSONResponse(status_code=404, content={"error": "Caso generado no encontrado"})
        sonido_id = caso["datos_clinicos"]["auscultacion_id"]
        sonido = SONIDOS[sonido_id].copy()
        sonido["id"] = sonido_id
        return {"sonidos": [sonido]}

    mapa = {
        "neumania": ["crepitantes", "normal_cardiaco"],
        "neumotorax": ["normal", "normal_cardiaco"],
        "derrame_pleural": ["crepitantes", "s3"],
        "asma": ["sibilancias", "normal_cardiaco"],
        "bronquitis": ["roncus", "normal_cardiaco"],
        "pleuritis": ["frote_pleural", "normal_cardiaco"],
        "insuficiencia_cardiaca": ["crepitantes", "s3"],
        "estenosis_aortica": ["normal", "soplo_sistolico"]
    }

    if patologia not in mapa:
        return JSONResponse(status_code=404, content={"error": "Patología no encontrada"})

    sonidos_caso = []
    for sid in mapa[patologia]:
        s = SONIDOS[sid].copy()
        s["id"] = sid
        sonidos_caso.append(s)

    return {"patologia": patologia, "sonidos": sonidos_caso}