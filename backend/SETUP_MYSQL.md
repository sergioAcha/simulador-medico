# 🗄️ Vincular Base de Datos con XAMPP

## Problema Actual
MySQL requiere autenticación. Necesitamos verificar la contraseña.

## ✅ Solución Paso a Paso

### 1️⃣ ASEGURATE QUE XAMPP ESTÉ CORRIENDO
- Abre **XAMPP Control Panel**
- Haz clic en **Start** junto a **MySQL**
- Debe aparecer en **verde** y decir "Running"

### 2️⃣ VERIFICA LA CONTRASEÑA DE MYSQL
En una terminal (PowerShell), ejecuta:
```bash
mysql -u root -h localhost
```

**Posibles resultados:**
- ✅ Si conecta sin pedir contraseña → la contraseña es **vacía**
- ❌ Si pide contraseña → pregunta cuál es
- ❌ Si dice "command not found" → agrega MySQL al PATH

### 3️⃣ SI NECESITAS AGREGAR MySQL AL PATH
1. Encuentra donde XAMPP instala MySQL (usualmente: `C:\xampp\mysql\bin`)
2. Abre una PowerShell como **Administrador**
3. Ejecuta:
```bash
$env:PATH += ";C:\xampp\mysql\bin"
```

### 4️⃣ ACTUALIZA EL ARCHIVO .env
Abre `backend/.env` y asegúrate de tener:

```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=simulador_medico
```

**Nota:** Si MySQL tiene contraseña, reemplaza `DB_PASSWORD=` con tu contraseña real.

### 5️⃣ INICIALIZA LA BASE DE DATOS
En la terminal, desde `backend/`:
```bash
python base_datos/database.py
```

Deberías ver:
```
✓ Base de datos inicializada correctamente.
```

---

## 🔍 SOLUCIÓN DE PROBLEMAS

### Error: "Access denied for user 'root'@'localhost' (using password: NO)"
→ MySQL está corriendo pero rechaza la conexión. Verifica `.env`

### Error: "Can't connect to MySQL server on 'localhost'"
→ MySQL no está corriendo en XAMPP. Abre XAMPP Control Panel y hazlo Start.

### Error: "mysql: command not found"
→ Agrega MySQL al PATH (ver paso 3️⃣)

---

## 📊 VER TUS BASES DE DATOS EN XAMPP

Una vez configurado, puedes ver la BD con **phpMyAdmin**:
1. Abre `http://localhost/phpmyadmin/`
2. Login con usuario: `root` (sin contraseña)
3. Verás la BD `simulador_medico`

---

## 🚀 PRÓXIMOS PASOS

Una vez que inicialices correctamente, tu aplicación usará **MySQL** en lugar de SQLite.
El resto del código está listo para MySQL.

