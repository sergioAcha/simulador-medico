"""
Script para probar la conexión a MySQL
Ejecuta: python test_conexion.py
"""
import mysql.connector
from mysql.connector import Error
import os
import sys
from dotenv import load_dotenv

load_dotenv()

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "simulador_medico")

print("=" * 60)
print("🔍 PRUEBA DE CONEXIÓN A MYSQL")
print("=" * 60)

print(f"\n📋 Configuración actual:")
print(f"   Host: {DB_HOST}")
print(f"   Puerto: {DB_PORT}")
print(f"   Usuario: {DB_USER}")
print(f"   Contraseña: {'(vacía)' if not DB_PASSWORD else '(oculta)'}")
print(f"   Base de datos: {DB_NAME}")

print(f"\n🔗 Intentando conectar...")

try:
    conn = mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        autocommit=True
    )
    
    print("✅ ¡CONEXIÓN EXITOSA!")
    print(f"\n🎉 MySQL está corriendo y aceptando conexiones.")
    
    cursor = conn.cursor()
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()
    print(f"   Versión de MySQL: {version[0]}")
    
    # Intentar conectar a la BD específica
    try:
        conn_db = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            autocommit=True
        )
        print(f"✅ Base de datos '{DB_NAME}' accesible.")
        conn_db.close()
    except Error as e:
        print(f"⚠️  Base de datos no existe aún (normal).")
        print(f"   Error: {e.msg}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("🚀 Ahora ejecuta: python base_datos/database.py")
    print("=" * 60)
    
except Error as e:
    print(f"❌ ERROR DE CONEXIÓN:")
    print(f"   {e.msg}")
    print("\n💡 SOLUCIONES:")
    print("   1. Asegúrate que MySQL está corriendo en XAMPP (verde)")
    print("   2. Verifica la contraseña en el archivo .env")
    print("   3. Si MySQL no tiene contraseña, deja DB_PASSWORD vacío")
    print("   4. Intenta con: mysql -u root -h localhost")
    print("=" * 60)
