from base_datos.database import get_connection

conn = get_connection()
cursor = conn.cursor(dictionary=True)
cursor.execute(
    """
    INSERT INTO usuarios (nombre, email, password, rol)
    VALUES (%s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        nombre = VALUES(nombre),
        password = VALUES(password),
        rol = VALUES(rol)
    """,
    ('Administrador', 'admin@osce.com', 'Admin2026', 'admin')
)
conn.commit()
conn.close()
print('Cuenta admin creada correctamente')
