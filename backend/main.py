from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modelos.diagnostico import router as diagnostico_router
from modulos.anamnesis import router as anamnesis_router
from modulos.auscultacion import router as auscultacion_router
from modulos.casos_ia import router as casos_ia_router, obtener_caso_ia
from modulos.osce import router as osce_router
from modulos.evaluador import evaluar_saber_ser, evaluar_saber_hacer, evaluar_saber_conocer, calcular_puntaje_total
from base_datos.database import get_connection, inicializar_db
from pydantic import BaseModel

app = FastAPI(title="Simulador Médico API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnostico_router, prefix="/diagnostico", tags=["Diagnóstico"])
app.include_router(anamnesis_router, prefix="/anamnesis", tags=["Anamnesis"])
app.include_router(auscultacion_router, prefix="/auscultacion", tags=["Auscultación"])
app.include_router(casos_ia_router, prefix="/casos-ia", tags=["Casos generados por IA"])
app.include_router(osce_router, prefix="/osce", tags=["OSCE"])

class UsuarioRegistro(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "estudiante"

@app.get("/")
def root():
    return {"estado": "Servidor activo", "version": "1.0.0"}

@app.post("/auth/registro")
def registro(data: UsuarioRegistro):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "INSERT INTO usuarios (nombre, email, password, rol) VALUES (%s, %s, %s, %s)",
            (data.nombre, data.email, data.password, data.rol)
        )
        conn.commit()
        usuario_id = cursor.lastrowid
        conn.close()
        return {"estado": "ok", "id": usuario_id, "nombre": data.nombre, "email": data.email, "rol": data.rol}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.post("/auth/login")
def login(data: dict):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM usuarios WHERE email = %s AND password = %s",
            (data.get("email"), data.get("password"))
        )
        usuario = cursor.fetchone()
        conn.close()
        if usuario:
            return {"estado": "ok", "usuario": dict(usuario)}
        return {"estado": "error", "mensaje": "Credenciales incorrectas"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/admin/usuarios")
def listar_usuarios():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY creado_en DESC")
        usuarios = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"estado": "ok", "usuarios": usuarios}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.put("/admin/usuarios/{usuario_id}/rol")
def cambiar_rol(usuario_id: int, data: dict):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("UPDATE usuarios SET rol = %s WHERE id = %s", (data.get("rol"), usuario_id))
        conn.commit()
        conn.close()
        return {"estado": "ok"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.delete("/admin/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("DELETE FROM usuarios WHERE id = %s AND rol != 'admin'", (usuario_id,))
        conn.commit()
        conn.close()
        return {"estado": "ok"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/profesor/sesiones")
def listar_sesiones():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*, u.nombre
            FROM sesiones_osce s
            LEFT JOIN usuarios u ON s.usuario_id = u.id
            ORDER BY s.fecha DESC
        """)
        sesiones = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"estado": "ok", "sesiones": sesiones}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/profesor/sesiones/{sesion_id}/historial")
def historial_sesion(sesion_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.usuario_id, s.caso_id
            FROM sesiones_osce s
            WHERE s.id = %s
        """, (sesion_id,))
        sesion = cursor.fetchone()
        
        if not sesion:
            return {"estado": "error", "mensaje": "Sesión no encontrada"}
        
        usuario_id = sesion['usuario_id']
        caso_id = sesion['caso_id']
        
        cursor.execute("""
            SELECT rol, mensaje, fecha
            FROM historial_anamnesis
            WHERE sesion_id LIKE %s
            ORDER BY fecha ASC
        """, (f"{usuario_id}_{caso_id}_%",))
        historial = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"estado": "ok", "historial": historial}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/profesor/sesiones/{sesion_id}/criterios")
def criterios_sesion(sesion_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT modulo, criterio_id, descripcion, puntaje, cumplido
            FROM criterios_evaluacion
            WHERE sesion_osce_id = %s
            ORDER BY modulo, criterio_id
        """, (sesion_id,))
        criterios = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Agrupar por módulo
        criterios_agrupados = {}
        for c in criterios:
            modulo = c['modulo']
            if modulo not in criterios_agrupados:
                criterios_agrupados[modulo] = []
            criterios_agrupados[modulo].append(c)
        
        return {"estado": "ok", "criterios": criterios_agrupados}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

class EvaluacionData(BaseModel):
    sesion_id: str
    caso_id: str
    diagnostico_estudiante: str
    radiografia_subida: bool
    sonidos_escuchados: bool

@app.post("/evaluacion/calcular")
def calcular_evaluacion(data: EvaluacionData):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT rol, mensaje FROM historial_anamnesis
            WHERE sesion_id = %s
            ORDER BY fecha ASC
        """, (data.sesion_id,))
        historial = cursor.fetchall()

        mensajes = [
            {"role": "user" if row["rol"] == "estudiante" else "assistant", "content": row["mensaje"]}
            for row in historial
        ]

        saber_ser = evaluar_saber_ser(mensajes)
        saber_hacer = evaluar_saber_hacer(mensajes, data.caso_id)
        caso_ia = obtener_caso_ia(data.caso_id) if data.caso_id.startswith("ia_") else None
        patologia_esperada = caso_ia["patologia"] if caso_ia else data.caso_id
        saber_conocer = evaluar_saber_conocer(
            data.diagnostico_estudiante,
            patologia_esperada,
            data.radiografia_subida,
            data.sonidos_escuchados,
            caso_ia["datos_clinicos"]["diagnosticos_aceptados"] if caso_ia else None
        )

        resultado = calcular_puntaje_total(saber_ser, saber_hacer, saber_conocer)

        try:
            usuario_id = int(data.sesion_id.split("_", 1)[0])
        except (ValueError, AttributeError):
            return {"estado": "error", "mensaje": "Sesion invalida"}

        cursor.execute("""
            SELECT id FROM sesiones_osce
            WHERE usuario_id = %s AND caso_id = %s
            ORDER BY fecha DESC
            LIMIT 1
        """, (usuario_id, data.caso_id))
        sesion_guardada = cursor.fetchone()

        if sesion_guardada:
            sesion_db_id = sesion_guardada["id"]
            cursor.execute("""
                UPDATE sesiones_osce
                SET puntaje = %s, completado = 1
                WHERE id = %s
            """, (resultado["total"], sesion_db_id))
        else:
            cursor.execute("""
                INSERT INTO sesiones_osce (usuario_id, caso_id, puntaje, completado)
                VALUES (%s, %s, %s, 1)
            """, (usuario_id, data.caso_id, resultado["total"]))
            sesion_db_id = cursor.lastrowid

        cursor.execute("""
            DELETE FROM resultados_diagnostico
            WHERE sesion_id = %s
        """, (sesion_db_id,))

        cursor.execute("""
            INSERT INTO resultados_diagnostico
            (sesion_id, patologia_detectada, confianza)
            VALUES (%s, %s, %s)
        """, (sesion_db_id, data.diagnostico_estudiante, resultado["porcentaje"]))
        conn.commit()
        conn.close()

        return {"estado": "ok", "resultado": resultado}

    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.put("/evaluacion/{sesion_id}/ajuste-profesor")
def ajuste_profesor(sesion_id: str, data: dict):
    try:
        ajuste = data.get("ajuste_saber_ser", 0)
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            UPDATE sesiones_osce
            SET puntaje = LEAST(100, puntaje + %s)
            WHERE id = %s
        """, (ajuste, sesion_id))
        conn.commit()
        conn.close()
        return {"estado": "ok"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}
    
class ClaseData(BaseModel):
    nombre: str
    descripcion: str = ""
    semestre: str = ""
    profesor_id: int = 1

class ActividadData(BaseModel):
    clase_id: int
    tipo: str
    titulo: str
    caso_id: str
    fecha_limite: str = None
    intentos_permitidos: int = 1

# ══ CLASES ══

@app.post("/profesor/clases")
def crear_clase(data: ClaseData):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO clases (nombre, descripcion, semestre, profesor_id)
            VALUES (%s, %s, %s, %s)
        """, (data.nombre, data.descripcion, data.semestre, data.profesor_id))
        conn.commit()
        clase_id = cursor.lastrowid
        conn.close()
        return {"estado": "ok", "clase_id": clase_id}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.post("/profesor/clases/{clase_id}/estudiantes")
def agregar_estudiante(clase_id: int, data: dict):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT IGNORE INTO clases_estudiantes (clase_id, estudiante_id)
            VALUES (%s, %s)
        """, (clase_id, data.get("estudiante_id")))
        conn.commit()
        conn.close()
        return {"estado": "ok"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.delete("/profesor/clases/{clase_id}/estudiantes/{estudiante_id}")
def eliminar_estudiante_clase(clase_id: int, estudiante_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM clases_estudiantes
            WHERE clase_id = %s AND estudiante_id = %s
        """, (clase_id, estudiante_id))
        conn.commit()
        conn.close()
        return {"estado": "ok"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/profesor/clases")
def listar_clases_profesor(profesor_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.*, COUNT(ce.estudiante_id) as total_estudiantes
            FROM clases c
            LEFT JOIN clases_estudiantes ce ON c.id = ce.clase_id
            WHERE c.profesor_id = %s
            GROUP BY c.id
            ORDER BY c.creado_en DESC
        """, (profesor_id,))
        clases = cursor.fetchall()
        conn.close()
        return {"estado": "ok", "clases": clases}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/profesor/clases/{clase_id}")
def detalle_clase(clase_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM clases WHERE id = %s", (clase_id,))
        clase = cursor.fetchone()
        cursor.execute("""
            SELECT u.id, u.nombre, u.email
            FROM clases_estudiantes ce
            JOIN usuarios u ON ce.estudiante_id = u.id
            WHERE ce.clase_id = %s
        """, (clase_id,))
        estudiantes = cursor.fetchall()
        cursor.execute("""
            SELECT u.id, u.nombre, u.email
            FROM usuarios u
            WHERE u.rol = 'estudiante'
            AND u.id NOT IN (
                SELECT estudiante_id FROM clases_estudiantes WHERE clase_id = %s
            )
        """, (clase_id,))
        disponibles = cursor.fetchall()
        conn.close()
        return {"estado": "ok", "clase": clase, "estudiantes": estudiantes, "disponibles": disponibles}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.delete("/profesor/clases/{clase_id}")
def eliminar_clase(clase_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM clases_estudiantes WHERE clase_id = %s", (clase_id,))
        cursor.execute("DELETE FROM clases WHERE id = %s", (clase_id,))
        conn.commit()
        conn.close()
        return {"estado": "ok"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

# ══ ACTIVIDADES ══

@app.post("/profesor/actividades")
def crear_actividad(data: ActividadData):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT profesor_id FROM clases WHERE id = %s", (data.clase_id,))
        clase = cursor.fetchone()
        cursor.execute("""
            INSERT INTO actividades (clase_id, tipo, titulo, caso_id, profesor_id, fecha_limite, intentos_permitidos)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (data.clase_id, data.tipo, data.titulo, data.caso_id, clase["profesor_id"], data.fecha_limite, data.intentos_permitidos))
        conn.commit()
        actividad_id = cursor.lastrowid
        conn.close()
        return {"estado": "ok", "actividad_id": actividad_id}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/profesor/clases/{clase_id}/actividades")
def listar_actividades(clase_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT a.*, COUNT(ia.id) as total_intentos
            FROM actividades a
            LEFT JOIN intentos_actividad ia ON a.id = ia.actividad_id
            WHERE a.clase_id = %s
            GROUP BY a.id
            ORDER BY a.creado_en DESC
        """, (clase_id,))
        actividades = cursor.fetchall()
        conn.close()
        return {"estado": "ok", "actividades": actividades}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.delete("/profesor/actividades/{actividad_id}")
def eliminar_actividad(actividad_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM intentos_actividad WHERE actividad_id = %s", (actividad_id,))
        cursor.execute("DELETE FROM actividades WHERE id = %s", (actividad_id,))
        conn.commit()
        conn.close()
        return {"estado": "ok"}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

# ══ ESTUDIANTE ══

@app.get("/estudiante/clases/{estudiante_id}")
def clases_estudiante(estudiante_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.*, u.nombre as profesor_nombre
            FROM clases c
            JOIN clases_estudiantes ce ON c.id = ce.clase_id
            JOIN usuarios u ON c.profesor_id = u.id
            WHERE ce.estudiante_id = %s AND c.activa = 1
        """, (estudiante_id,))
        clases = cursor.fetchall()
        conn.close()
        return {"estado": "ok", "clases": clases}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}

@app.get("/estudiante/clases/{clase_id}/actividades/{estudiante_id}")
def actividades_estudiante(clase_id: int, estudiante_id: int):
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT a.*,
                COUNT(ia.id) as intentos_realizados,
                MAX(ia.puntaje) as mejor_puntaje
            FROM actividades a
            LEFT JOIN intentos_actividad ia ON a.id = ia.actividad_id AND ia.estudiante_id = %s
            WHERE a.clase_id = %s
            GROUP BY a.id
            ORDER BY a.fecha_limite ASC
        """, (estudiante_id, clase_id))
        actividades = cursor.fetchall()
        conn.close()
        return {"estado": "ok", "actividades": actividades}
    except Exception as e:
        return {"estado": "error", "mensaje": str(e)}
