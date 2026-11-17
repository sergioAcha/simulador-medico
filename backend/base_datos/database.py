import mysql.connector
import os

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'simulador_medico'
}

CASOS_INICIALES = [
    (
        "Caso 1 - Neumonía Bacteriana",
        "Paciente de 58 años con tos productiva y fiebre desde hace cuatro días. Si le preguntan, refiere flema amarillenta, escalofríos y dolor en el costado derecho al respirar profundamente. Tiene hipertensión y toma una pastilla diaria cuyo nombre no recuerda.",
        "neumania",
        "basico",
    ),
    (
        "Caso 2 - Neumotórax Espontáneo",
        "Paciente de 24 años, delgado y fumador ocasional, con dolor súbito en el lado derecho del pecho y falta de aire desde hace dos horas. El dolor empeora al inspirar profundamente. No recuerda traumatismos recientes y no tiene antecedentes médicos importantes.",
        "neumotorax",
        "intermedio",
    ),
    (
        "Caso 3 - Derrame Pleural",
        "Paciente de 66 años con falta de aire progresiva y tos seca desde hace dos semanas. Refiere pesadez y molestia en el costado izquierdo, que empeora al acostarse. Tiene antecedentes de insuficiencia cardiaca y toma medicamentos para el corazón.",
        "derrame_pleural",
        "avanzado",
    ),
    (
        "Caso 4 - Crisis Asmática Moderada",
        "Paciente de 19 años con episodios de silbidos en el pecho, tos y dificultad para respirar desde ayer. Empeora durante la noche y con el polvo. Tiene asma desde la infancia y usa un inhalador de rescate, aunque hoy siente que le ayuda menos.",
        "crisis_asmatica",
        "intermedio",
    ),
    (
        "Caso 5 - Infarto Agudo de Miocardio",
        "Paciente de 59 años con opresión intensa en el centro del pecho desde hace 40 minutos, acompañada de sudor frío y náuseas. La molestia se extiende al brazo izquierdo y no mejora con el reposo. Tiene diabetes, hipertensión y fuma.",
        "infarto_miocardio",
        "avanzado",
    ),
    (
        "Caso 6 - Tromboembolismo Pulmonar",
        "Paciente de 42 años con falta de aire repentina y dolor en el pecho al respirar desde esta mañana. Refiere que hace una semana tuvo una cirugía de rodilla y desde entonces una pierna está hinchada y dolorida. Se siente ansiosa y algo mareada.",
        "tromboembolismo_pulmonar",
        "avanzado",
    ),
    (
        "Caso 7 - EPOC / Bronquitis Crónica",
        "Paciente de 67 años, fumador de larga data, con tos y flema habituales que han empeorado durante cinco días. Ahora le cuesta más respirar al caminar y la flema es más abundante. Usa inhaladores y ha tenido episodios parecidos anteriormente.",
        "bronquitis_cronica",
        "intermedio",
    ),
    (
        "Caso 8 - Angina Pectoris Inestable",
        "Paciente de 61 años con presión en el pecho que aparece incluso estando en reposo desde hace dos días. Cada episodio dura varios minutos y puede extenderse al cuello. Tiene colesterol alto, hipertensión y antecedentes familiares de problemas del corazón.",
        "angina_inestable",
        "intermedio",
    ),
    (
        "Caso 9 - Pericarditis Aguda",
        "Paciente de 31 años con dolor punzante en el centro del pecho desde hace dos días, después de un cuadro gripal. El dolor empeora al acostarse y al respirar hondo, pero mejora un poco al sentarse e inclinarse hacia delante. Tiene febrícula y cansancio.",
        "pericarditis_aguda",
        "avanzado",
    ),
    (
        "Caso 10 - Insuficiencia Aórtica",
        "Paciente de 54 años con cansancio y falta de aire al hacer esfuerzos desde hace varios meses. Nota palpitaciones y a veces siente el corazón muy fuerte al acostarse. Tiene antecedentes de hipertensión, pero no recuerda el nombre de su medicamento.",
        "insuficiencia_aortica",
        "avanzado",
    ),
    (
        "Caso 11 - Apendicitis Aguda",
        "Paciente de 22 años con dolor abdominal que comenzó alrededor del ombligo hace diez horas y ahora se localiza abajo a la derecha. Tiene náuseas, poco apetito y algo de fiebre. El dolor empeora al caminar o toser.",
        "apendicitis_aguda",
        "basico",
    ),
    (
        "Caso 12 - Colecistitis Aguda",
        "Paciente de 46 años con dolor constante debajo de las costillas del lado derecho desde anoche, después de una comida abundante. El dolor se extiende hacia la espalda y el hombro derecho; tiene náuseas y fiebre. Ha tenido episodios más leves después de comer alimentos grasos.",
        "colecistitis_aguda",
        "intermedio",
    ),
]

def get_connection():
    conn = mysql.connector.connect(**DB_CONFIG)
    conn.autocommit = False
    return conn

def inicializar_db():
    conn = mysql.connector.connect(
        host=DB_CONFIG['host'],
        port=DB_CONFIG['port'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password']
    )
    cursor = conn.cursor()

    cursor.execute("CREATE DATABASE IF NOT EXISTS simulador_medico CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    cursor.execute("USE simulador_medico")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            rol VARCHAR(50) DEFAULT 'estudiante',
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS casos_clinicos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            descripcion TEXT NOT NULL,
            patologia VARCHAR(255) NOT NULL,
            dificultad VARCHAR(50) DEFAULT 'basico',
            activo INT DEFAULT 1
        )
    """)

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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sesiones_osce (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            caso_id VARCHAR(100) NOT NULL,
            puntaje FLOAT DEFAULT 0,
            tiempo_segundos INT DEFAULT 0,
            completado INT DEFAULT 0,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS resultados_diagnostico (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sesion_id VARCHAR(255) NOT NULL,
            patologia_detectada TEXT,
            confianza FLOAT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS historial_anamnesis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sesion_id VARCHAR(255) NOT NULL,
            rol VARCHAR(50) NOT NULL,
            mensaje TEXT NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS criterios_evaluacion (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sesion_osce_id INT,
            criterio_id VARCHAR(50),
            modulo VARCHAR(50),
            descripcion TEXT,
            puntaje FLOAT,
            cumplido INT DEFAULT 0,
            FOREIGN KEY (sesion_osce_id) REFERENCES sesiones_osce(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS evaluaciones_detalle (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sesion_id VARCHAR(255) NOT NULL,
            usuario_id INT NOT NULL,
            caso_id VARCHAR(100) NOT NULL,
            puntaje_total FLOAT DEFAULT 0,
            porcentaje FLOAT DEFAULT 0,
            aprobado INT DEFAULT 0,
            saber_ser_puntaje FLOAT DEFAULT 0,
            saber_ser_detalle TEXT,
            saber_hacer_puntaje FLOAT DEFAULT 0,
            saber_hacer_detalle TEXT,
            saber_conocer_puntaje FLOAT DEFAULT 0,
            saber_conocer_detalle TEXT,
            diagnostico_estudiante TEXT,
            ajuste_profesor FLOAT DEFAULT 0,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            descripcion TEXT,
            profesor_id INT NOT NULL,
            semestre VARCHAR(100),
            activa INT DEFAULT 1,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (profesor_id) REFERENCES usuarios(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS clases_estudiantes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            clase_id INT NOT NULL,
            estudiante_id INT NOT NULL,
            fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (clase_id) REFERENCES clases(id),
            FOREIGN KEY (estudiante_id) REFERENCES usuarios(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS actividades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            clase_id INT NOT NULL,
            tipo ENUM('tarea','practica','examen') NOT NULL,
            titulo VARCHAR(255) NOT NULL,
            caso_id VARCHAR(100) NOT NULL,
            profesor_id INT NOT NULL,
            fecha_limite DATETIME,
            intentos_permitidos INT DEFAULT 1,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (clase_id) REFERENCES clases(id),
            FOREIGN KEY (profesor_id) REFERENCES usuarios(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS intentos_actividad (
            id INT AUTO_INCREMENT PRIMARY KEY,
            actividad_id INT NOT NULL,
            estudiante_id INT NOT NULL,
            numero_intento INT DEFAULT 1,
            sesion_id VARCHAR(255),
            puntaje FLOAT DEFAULT 0,
            enviado INT DEFAULT 0,
            completado INT DEFAULT 0,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (actividad_id) REFERENCES actividades(id),
            FOREIGN KEY (estudiante_id) REFERENCES usuarios(id)
        )
    """)

    for titulo, descripcion, patologia, dificultad in CASOS_INICIALES:
        cursor.execute(
            "SELECT id FROM casos_clinicos WHERE patologia = %s LIMIT 1",
            (patologia,)
        )
        if cursor.fetchone() is None:
            cursor.execute(
                """
                INSERT INTO casos_clinicos (titulo, descripcion, patologia, dificultad, activo)
                VALUES (%s, %s, %s, %s, 1)
                """,
                (titulo, descripcion, patologia, dificultad)
            )

    conn.commit()
    cursor.close()
    conn.close()
    print("Base de datos MySQL inicializada correctamente.")

if __name__ == "__main__":
    inicializar_db()