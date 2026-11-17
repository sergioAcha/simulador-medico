from base_datos.database import get_connection

conn = get_connection()
cursor = conn.cursor(dictionary=True)
cursor.execute(
    "UPDATE usuarios SET password = %s WHERE email = %s",
    ('Admin2026', 'admin@osce.com')
)
conn.commit()
print('Contraseña actualizada')
print('Filas afectadas:', cursor.rowcount)
conn.close()
