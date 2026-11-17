"""
Intenta conectar con contraseñas comunes en XAMPP
Ejecuta: python encontrar_password.py
"""
import mysql.connector
from mysql.connector import Error

# Contraseñas comunes en XAMPP
PASSWORDS_COMUNES = [
    "",
    "password",
    "123456",
    "admin",
    "root",
    "xampp",
    "1234",
    "12345",
    "123",
    "admin123"
]

print("=" * 60)
print("🔐 INTENTANDO CONTRASEÑAS COMUNES...")
print("=" * 60)

for pwd in PASSWORDS_COMUNES:
    try:
        conn = mysql.connector.connect(
            host="localhost",
            port=3306,
            user="root",
            password=pwd,
            autocommit=True
        )
        print(f"\n✅ ¡ENCONTRADA! Contraseña correcta: '{pwd}'")
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"   MySQL: {version[0]}")
        cursor.close()
        conn.close()
        
        print("\n📝 ACTUALIZA TU .env:")
        print(f'   DB_PASSWORD={pwd}')
        print("\n🚀 Luego ejecuta: python base_datos/database.py")
        break
    except Error:
        print(f"❌ Contraseña '{pwd}' - no funciona")

print("\n" + "=" * 60)
