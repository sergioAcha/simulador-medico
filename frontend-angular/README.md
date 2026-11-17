# Frontend Angular — Simulador Médico OSCE

Este frontend es una aplicación independiente, agregada junto al frontend React
existente. No reemplaza ni modifica la aplicación React. Ambos usan el mismo
backend FastAPI y la misma base de datos.

## Requisitos

- Node.js y npm
- Backend FastAPI funcionando en `http://127.0.0.1:8000`

## Ejecutar

Desde esta carpeta:

```powershell
npm start
```

Abre `http://localhost:4200`. El servidor Angular reenvía las rutas `/auth`
al backend local para el inicio de sesión y registro.

Para compilar la aplicación:

```powershell
npm run build
```

El frontend React permanece en `../frontend` y se puede seguir iniciando por
separado con `npm start` desde esa carpeta.

Los medios locales del panel de bienvenida son:

- `public/doctor-consultation.mp4`: video de consulta médica de cottonbro studio,
  [Pexels](https://www.pexels.com/video/doctor-talking-to-the-patient-7579338/).
- `public/doctor-photo.jpg`: imagen de fallback para el video, de
  [Unsplash](https://images.unsplash.com/photo-1612349317150-e413f6a5b16d).

Pexels permite el uso de su contenido en sitios y aplicaciones según su
[licencia](https://www.pexels.com/license/); Unsplash publica su
[licencia](https://unsplash.com/license) para la imagen de fallback.
