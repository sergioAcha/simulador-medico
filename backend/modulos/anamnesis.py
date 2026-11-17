from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import ollama
from modulos.casos_ia import obtener_caso_ia

router = APIRouter()

historial_conversacion = {}

INSTRUCCIONES_GLOBALES = """<|system|>
You are roleplaying as a real patient in a medical consultation. The medical student is the doctor. You must respond ONLY in Spanish.

ABSOLUTE RULES:
- You are a patient, not an AI
- Never break character
- Never reveal your diagnosis by its medical name
- Never volunteer information not asked for
- Keep responses to 1-2 short sentences maximum
- Never ask questions back to the doctor
- Respond ONLY to what was asked

INFORMATION DISCLOSURE (only when specifically asked):
- Name/age → only when asked for personal data
- Chief complaint → only when asked why you came
- Symptom onset → only when asked when it started
- Symptom description → only when asked how it feels
- Aggravating factors → only when asked what makes it worse
- Relieving factors → only when asked what makes it better
- Medical history → only when asked about past illnesses
- Medications → only when asked
- Family history → only when asked

LANGUAGE RULES:
- Use everyday colloquial Spanish
- If doctor uses medical terms you wouldn't know, ask what they mean
- If asked something you already answered, show mild frustration
- If your case involves severe pain or breathing crisis, use very short fragmented phrases with "..."

STRICT EXAMPLES:

Doctor: "Buenos días, soy el Dr. García. ¿Su nombre?"
You: "Humberto, doctor."

Doctor: "¿Qué lo trae por aquí?"
You: "Tengo tos y me cuesta respirar."

Doctor: "¿Desde cuándo?"
You: "Unos días ya."

Doctor: "¿Tiene fiebre?"
You: "Un poco sí."

Doctor: "¿Toma algún medicamento?"
You: "Pastillas para la presión, pero no recuerdo el nombre."

NEVER do this:
Doctor: "¿Qué lo trae por aquí?"
WRONG: "Tengo exacerbación de EPOC con tos productiva verdosa, disnea de esfuerzo y fatiga extrema desde hace una semana, además de antecedente de tabaquismo intenso."
RIGHT: "Tengo tos con flema y me falta el aire, doctor."
<|end|>
"""

def get_caso_from_db(caso_id: str):
    if caso_id.startswith("ia_"):
        return obtener_caso_ia(caso_id)
    try:
        from base_datos.database import get_connection
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM casos_clinicos WHERE patologia = %s AND activo = 1",
            (caso_id,)
        )
        caso = cursor.fetchone()
        conn.close()
        return caso
    except Exception as e:
        print(f"Error cargando caso: {e}")
        return None

class MensajeEntrada(BaseModel):
    caso_id: str
    mensaje: str
    sesion_id: str

@router.post("/iniciar")
def iniciar_caso(data: dict):
    caso_id = data.get("caso_id")
    sesion_id = data.get("sesion_id")

    caso = get_caso_from_db(caso_id)
    if not caso:
        return JSONResponse(status_code=404, content={"error": "Caso no encontrado"})

    historial_conversacion[sesion_id] = []

    return {
        "estado": "ok",
        "caso": caso["titulo"],
        "mensaje_inicial": "El paciente entra a consulta. Puedes comenzar la anamnesis."
    }

@router.post("/mensaje")
def enviar_mensaje(data: MensajeEntrada):
    caso_id = data.caso_id
    sesion_id = data.sesion_id
    mensaje = data.mensaje

    caso = get_caso_from_db(caso_id)
    if not caso:
        return JSONResponse(status_code=404, content={"error": "Caso no encontrado"})

    if sesion_id not in historial_conversacion:
        historial_conversacion[sesion_id] = []

    historial_conversacion[sesion_id].append({
        "role": "user",
        "content": mensaje
    })

    system_prompt = INSTRUCCIONES_GLOBALES + "\n\nYOUR CHARACTER (do not reveal the diagnosis name):\n" + caso["descripcion"]

    mensajes = [
        {"role": "system", "content": system_prompt},
        *historial_conversacion[sesion_id]
    ]

    try:
        respuesta = ollama.chat(
            model="llama3.1",
            messages=mensajes,
            options={
                "temperature": 0.7,
                "top_p": 0.9,
                "repeat_penalty": 1.1
            }
        )

        texto_respuesta = respuesta["message"]["content"]

        historial_conversacion[sesion_id].append({
            "role": "assistant",
            "content": texto_respuesta
        })

        try:
            from base_datos.database import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO historial_anamnesis (sesion_id, rol, mensaje) VALUES (%s, %s, %s)",
                (sesion_id, "estudiante", mensaje)
            )
            cursor.execute(
                "INSERT INTO historial_anamnesis (sesion_id, rol, mensaje) VALUES (%s, %s, %s)",
                (sesion_id, "paciente", texto_respuesta)
            )
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error guardando historial: {e}")

        return {
            "estado": "ok",
            "respuesta": texto_respuesta,
            "turnos": len(historial_conversacion[sesion_id]) // 2
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.get("/casos")
def listar_casos():
    try:
        from base_datos.database import get_connection
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, titulo, patologia, dificultad FROM casos_clinicos WHERE activo = 1 ORDER BY id")
        casos = cursor.fetchall()
        conn.close()
        return {"casos": casos}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@router.delete("/limpiar/{sesion_id}")
def limpiar_historial(sesion_id: str):
    if sesion_id in historial_conversacion:
        del historial_conversacion[sesion_id]
    return {"estado": "ok", "mensaje": "Historial limpiado"}