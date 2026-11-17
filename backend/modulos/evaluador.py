import re
import unicodedata

def evaluar_saber_ser(mensajes):
    puntaje = 0
    detalles = {}

    textos = [m["content"].lower() for m in mensajes if m["role"] == "user"]
    texto_completo = " ".join(textos)

    # Presentación y consentimiento (5 pts)
    saludos = ["buenos días", "buenas tardes", "buenas noches", "hola", "buen día"]
    presentacion = ["soy el dr", "soy la dra", "soy el médico", "soy estudiante", "me llamo", "mi nombre es", "me presento"]
    tiene_saludo = any(s in texto_completo for s in saludos)
    tiene_presentacion = any(p in texto_completo for p in presentacion)
    pts_presentacion = 5 if (tiene_saludo and tiene_presentacion) else (2 if tiene_saludo else 0)
    puntaje += pts_presentacion
    detalles["presentacion"] = {"puntaje": pts_presentacion, "maximo": 5}

    # Trato empático (5 pts)
    frases_rudas = ["dime ya", "habla", "rápido", "apúrate", "no me hagas perder", "deja de"]
    abreviaturas = [" q ", " pq ", " xq ", " tb ", " tmb ", " xfa ", " pls "]
    tiene_rudeza = any(r in texto_completo for r in frases_rudas)
    tiene_abreviaturas_rudas = sum(1 for a in abreviaturas if a in f" {texto_completo} ")
    pts_empatia = 5 if not tiene_rudeza else 2
    if tiene_abreviaturas_rudas > 2:
        pts_empatia = max(0, pts_empatia - 2)
    puntaje += pts_empatia
    detalles["empatia"] = {"puntaje": pts_empatia, "maximo": 5}

    # Vocabulario adecuado (5 pts)
    abreviaturas_informales = ["q ", "pq ", "xq ", "tb ", "tmb ", "xfa ", "jaja", "xd", "lol"]
    count_abrev = sum(1 for a in abreviaturas_informales if a in texto_completo)
    pts_vocabulario = 5 if count_abrev == 0 else (3 if count_abrev <= 2 else 0)
    puntaje += pts_vocabulario
    detalles["vocabulario"] = {"puntaje": pts_vocabulario, "maximo": 5}

    # Cierre de entrevista (5 pts)
    cierres = ["procederé a", "voy a escuchar", "vamos a revisar", "le voy a realizar", "ahora voy a", "pasaremos a"]
    tiene_cierre = any(c in texto_completo for c in cierres)
    pts_cierre = 5 if tiene_cierre else 0
    puntaje += pts_cierre
    detalles["cierre"] = {"puntaje": pts_cierre, "maximo": 5}

    return {"puntaje": puntaje, "maximo": 20, "detalles": detalles}


def evaluar_saber_hacer(mensajes, patologia):
    puntaje = 0
    detalles = {}

    textos = [m["content"].lower() for m in mensajes if m["role"] == "user"]
    texto_completo = " ".join(textos)

    # Filiación e identificación (10 pts)
    filiacion = ["cuántos años", "qué edad", "a qué se dedica", "ocupación", "trabaja", "de dónde", "vive"]
    pts_filiacion = min(10, sum(2 for f in filiacion if f in texto_completo))
    puntaje += pts_filiacion
    detalles["filiacion"] = {"puntaje": pts_filiacion, "maximo": 10}

    # Motivo de consulta y ALICIA (15 pts)
    alicia = {
        "aparicion": ["cuándo empezó", "desde cuándo", "cuánto tiempo", "cuando comenzó"],
        "localizacion": ["dónde le duele", "dónde siente", "en qué parte", "dónde exactamente"],
        "intensidad": ["qué tan fuerte", "del 1 al 10", "cuánto le duele", "intensidad"],
        "caracter": ["cómo es el dolor", "cómo describe", "es punzante", "es opresivo", "cómo siente"],
        "irradiacion": ["se corre", "se va", "irradia", "se extiende", "siente en otro"],
        "alivio": ["qué le mejora", "qué le alivia", "algo que mejore", "empeora con", "mejora con"]
    }
    pts_alicia = 0
    alicia_detalles = {}
    for componente, keywords in alicia.items():
        encontrado = any(k in texto_completo for k in keywords)
        pts_alicia += 2 if encontrado else 0
        alicia_detalles[componente] = encontrado
    pts_alicia = min(15, pts_alicia + (3 if pts_alicia >= 10 else 0))
    puntaje += pts_alicia
    detalles["motivo_consulta"] = {"puntaje": pts_alicia, "maximo": 15, "alicia": alicia_detalles}

    # Antecedentes (15 pts)
    antecedentes = [
        "enfermedades", "operaciones", "cirugías", "alergias", "medicamentos",
        "fuma", "bebe", "alcohol", "tabaco", "antecedentes familiares",
        "familia", "padres", "presión alta", "diabetes", "asma"
    ]
    pts_antecedentes = min(15, sum(2 for a in antecedentes if a in texto_completo))
    puntaje += pts_antecedentes
    detalles["antecedentes"] = {"puntaje": pts_antecedentes, "maximo": 15}

    # Revisión por sistemas (10 pts)
    sistemas = ["fiebre", "tos", "flema", "esputo", "dificultad para respirar",
                "náuseas", "vómito", "apetito", "peso", "orina", "deposiciones"]
    pts_sistemas = min(10, sum(2 for s in sistemas if s in texto_completo))
    puntaje += pts_sistemas
    detalles["revision_sistemas"] = {"puntaje": pts_sistemas, "maximo": 10}

    return {"puntaje": puntaje, "maximo": 50, "detalles": detalles}


def evaluar_saber_conocer(
    diagnostico_estudiante,
    patologia_esperada,
    radiografia_subida,
    sonidos_escuchados,
    diagnosticos_aceptados=None
):
    puntaje = 0
    detalles = {}

    # Técnica de exploración (10 pts)
    pts_exploracion = 10 if sonidos_escuchados else 0
    puntaje += pts_exploracion
    detalles["exploracion"] = {"puntaje": pts_exploracion, "maximo": 10}

    # Solicitud de examen complementario (10 pts)
    pts_radiografia = 10 if radiografia_subida else 0
    puntaje += pts_radiografia
    detalles["radiografia"] = {"puntaje": pts_radiografia, "maximo": 10}

    # Juicio diagnóstico (10 pts)
    pts_diagnostico = 0
    if diagnostico_estudiante:
        diag = diagnostico_estudiante.lower()
        patologia = patologia_esperada.lower()

        if diagnosticos_aceptados:
            normalizar = lambda texto: "".join(
                caracter
                for caracter in unicodedata.normalize("NFKD", texto.lower())
                if not unicodedata.combining(caracter)
            )
            diagnostico_normalizado = normalizar(diag)
            pts_diagnostico = 10 if any(
                normalizar(opcion) in diagnostico_normalizado
                for opcion in diagnosticos_aceptados
            ) else 0
            puntaje += pts_diagnostico
            detalles["diagnostico"] = {"puntaje": pts_diagnostico, "maximo": 10}
            return {
                "puntaje": puntaje,
                "maximo": 30,
                "detalles": detalles
            }

        sinonimos = {
            "neumania": ["neumonía", "neumonia", "infección pulmonar", "infeccion pulmonar", "pneumonia"],
            "neumotorax": ["neumotórax", "neumotorax", "aire en el pulmón", "colapso pulmonar"],
            "derrame_pleural": ["derrame pleural", "líquido en el pulmón", "liquido en pleura", "pleuritis"]
        }

        palabras_clave = sinonimos.get(patologia_esperada, [patologia])
        coincidencias = sum(1 for p in palabras_clave if p in diag)

        if coincidencias >= 2 or (
            patologia_esperada not in sinonimos and coincidencias == 1
        ):
            pts_diagnostico = 10
        elif coincidencias == 1:
            pts_diagnostico = 6
        else:
            pts_diagnostico = 0

    puntaje += pts_diagnostico
    detalles["diagnostico"] = {"puntaje": pts_diagnostico, "maximo": 10}

    return {"puntaje": puntaje, "maximo": 30, "detalles": detalles}


def calcular_puntaje_total(saber_ser, saber_hacer, saber_conocer):
    total = saber_ser["puntaje"] + saber_hacer["puntaje"] + saber_conocer["puntaje"]
    maximo = 100
    porcentaje = round((total / maximo) * 100, 1)
    return {
        "total": total,
        "maximo": maximo,
        "porcentaje": porcentaje,
        "aprobado": porcentaje >= 60,
        "bloques": {
            "saber_ser": saber_ser,
            "saber_hacer": saber_hacer,
            "saber_conocer": saber_conocer
        }
    }