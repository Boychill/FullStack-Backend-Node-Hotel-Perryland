# Perryland Backend API

Backend del sistema ERP para Perryland, construido con Node.js, Express y MongoDB.

## Requisitos Previos

- Node.js (v18+)
- MongoDB (Local o Atlas)

## Instalación

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Configurar variables de entorno:
    - Copia el archivo de ejemplo: `cp .env.example .env`
    - Edita `.env` con tu configuración local.

## Ejecución

- **Desarrollo:**
  ```bash
  npm run dev
  ```
  (Usa `nodemon` para reinicio automático).

- **Producción:**
  ```bash
  npm start
  ```

## Estructura del Proyecto

- `src/app.js`: Punto de entrada de la aplicación.
- `src/config`: Configuraciones (Base de datos, etc).
- `src/controllers`: Lógica de negocio de los endpoints.
- `src/models`: Esquemas de datos Mongoose.
- `src/routes`: Definiciones de rutas de la API.
- `src/middleware`: Middlewares personalizados (Auth, Error handling).
- `src/utils`: Utilidades y helpers.
