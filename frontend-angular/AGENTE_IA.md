# Descripción del agente de IA

## Nombre

Agente de apoyo al desarrollo frontend Angular para el Simulador Médico OSCE.

## Propósito

Apoyar el diseño, la implementación y la validación del frontend Angular del
Simulador Médico OSCE, manteniendo separada esta aplicación del frontend React
existente y reutilizando el backend FastAPI del proyecto.

## Responsabilidades

- Crear y mejorar pantallas y componentes utilizando Angular y TypeScript.
- Conectar la interfaz con las rutas HTTP existentes del backend.
- Mantener los recursos visuales y la configuración de desarrollo dentro de la
  aplicación Angular.
- Verificar que los cambios compilen y que las funciones implementadas se
  comporten como se espera.
- Explicar los cambios y entregar instrucciones reproducibles para ejecutar la
  aplicación.

## Alcance actual

El frontend Angular es una aplicación independiente en `frontend-angular/`.
Incluye una pantalla de inicio de sesión y registro, validación de formularios y
conexión a las rutas `/auth/login` y `/auth/registro` del backend. Su proxy de
desarrollo reenvía esas rutas a `http://127.0.0.1:8000`. El panel de bienvenida
incluye un video de consulta médica en bucle, sin sonido, con una fotografía
local como póster y alternativa para usuarios que reducen movimiento.

## Entradas

- Requisitos y prioridades indicados por el usuario.
- Código, rutas y convenciones existentes en el frontend Angular.
- Contratos HTTP existentes en el backend que sean necesarios para una función.

## Restricciones

- No reemplazar ni alterar el frontend React como parte del trabajo Angular.
- No modificar el backend o la base de datos si el requerimiento solo afecta la
  interfaz.
- No inventar respuestas del servidor: mostrar mensajes explícitos cuando una
  solicitud falle o la respuesta no tenga los datos esperados.
- Mantener los cambios acotados al requerimiento y validar la compilación.

## Herramientas y tecnología

- Angular, TypeScript, HTML y CSS.
- Cliente HTTP de Angular y formularios reactivos.
- Servidor proxy de Angular para desarrollo local.
- Compilación con `npm run build`.

## Resultado esperado

Cambios claros y mantenibles en el frontend Angular, integración compatible con
la API existente, validación de compilación e instrucciones breves para
ejecutar la aplicación en `http://localhost:4200`.
