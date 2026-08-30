# 🚀 Vyrtium E-commerce API · Backend

API REST empresarial construida para la gestión integral de catálogo de productos, categorías comerciales con integridad relacional, autenticación segura mediante arquitectura de doble token (Access + Refresh Token con rotación e invalidación inmediata), subida de imágenes a Cloudinary y sistema de notificaciones transaccionales multicanal basado en el **Patrón Strategy** con **Resend**.

---

## 🛠️ Stack Tecnológico

| Capa / Tecnología | Herramienta | Propósito |
|---|---|---|
| **Runtime & Lenguaje** | Node.js (v20+) + TypeScript 5.8 (Strict Mode) | Ejecución tipada con cero inferencias implícitas `any` |
| **Framework HTTP** | Express.js 5.2 | Ruteo modular y middlewares desacoplados |
| **ORM & Base de Datos** | TypeORM 0.3 + PostgreSQL | Persistencia relacional, Soft Delete (`@DeleteDateColumn`) y checks `@Check` |
| **Seguridad & Hashing** | Bcrypt (Cost 12), Helmet, CORS | Cifrado seguro de credenciales y protección de cabeceras HTTP |
| **Autenticación** | Dual Token JWT (`15m` Access + `7d` Refresh) | Rotación de Refresh Token con Absolute Lifetime y revocación por `tokenVersion` |
| **Validación de Datos** | Zod 3.24 | Validación estricta y coerción de esquemas de entrada |
| **Almacenamiento Multimedia** | Cloudinary SDK + Multer (Memory Storage) | Subida y optimización automática de imágenes vía Streams |
| **Notificaciones Transaccionales**| Strategy Pattern + Resend SDK | Motor de notificaciones multicanal desacoplado con email HTML responsivo |
| **Logging Estructurado** | Pino & Pino-HTTP | Logs JSON de alto rendimiento con correlación de peticiones |
| **Documentación Interactiva** | OpenAPI 3.0 + Swagger UI | Explorador interactivo de endpoints en `/api/docs` |

---

## 📐 Decisiones de Arquitectura (ADRs)

La arquitectura sigue los principios de **Clean Architecture** y **Modular Monolith**, con especificaciones detalladas para cada fase:

- [01 · Scaffolding & Configuración Base](docs/01-scaffolding-spec.md)
- [02 · Modelado de Base de Datos y Entidades](docs/02-database-spec.md)
- [03 · Módulo de Autenticación Dual Token & Rotación](docs/03-auth-spec.md)
- [04 · CRUD de Categorías e Integridad Relacional](docs/04-category-crud-spec.md)
- [05 · CRUD de Productos y Catálogo Público](docs/05-product-crud-spec.md)
- [06 · Sistema de Notificaciones con Patrón Strategy y Resend](docs/06-notifications-spec.md)
- [07 · Sembrado de Datos de Prueba (Seeders en COP)](docs/07-seeders-spec.md)

---

## ⚙️ Variables de Entorno (`.env`)

Copia el archivo `.env.example` a `.env` y configura los valores correspondientes:

```bash
cp .env.example .env
```

| Variable | Descripción | Valor Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor HTTP | `4000` |
| `NODE_ENV` | Entorno de ejecución (`development` / `production`) | `development` |
| `DB_HOST` | Host de la base de datos PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `vyrtium_db` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `tu_password` |
| `JWT_SECRET` | Clave secreta para firmar Access Tokens (min 32 chars) | `super_secret_access_jwt_key_...` |
| `JWT_ACCESS_EXPIRES_IN` | Tiempo de vida del Access Token | `15m` |
| `JWT_REFRESH_SECRET` | Clave secreta para firmar Refresh Tokens | `super_secret_refresh_jwt_key_...` |
| `JWT_REFRESH_EXPIRES_IN` | Tiempo de vida máximo de la sesión | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Nombre de la nube de Cloudinary | `tu_cloud_name` |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | `tu_api_key` |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | `tu_api_secret` |
| `RESEND_API_KEY` | API Key de Resend para envío de emails | `re_...` (opcional en dev) |
| `EMAIL_FROM` | Remitente del correo transaccional | `Vyrtium <onboarding@resend.dev>` |
| `FRONTEND_URL` | URL del cliente frontend para CORS | `http://localhost:3000` |

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar el repositorio e instalar dependencias
```bash
pnpm install
```

### 2. Sembrar datos iniciales (Categorías y Productos en COP)
El script es 100% idempotente y puebla el catálogo comercial con imágenes reales de Unsplash y precios en Pesos Colombianos:
```bash
pnpm seed
```

### 3. Iniciar el servidor en modo desarrollo
```bash
pnpm dev
```
El servidor estará escuchando en `http://localhost:4000`.

---

## 📚 Documentación Interactiva (Swagger UI)

Una vez iniciado el servidor, accede a la documentación interactiva OpenAPI 3.0 en:

👉 **[http://localhost:4000/api/docs](http://localhost:4000/api/docs)**

Permite probar todos los endpoints directamente desde el navegador, incluyendo autenticación mediante Bearer Token y subida binaria de imágenes.

---

## 📡 Resumen de Endpoints

### 🔐 Autenticación (`/api/auth`)
- `POST /api/auth/registro`: Registro de usuario (dispara correo de bienvenida asíncrono vía Resend).
- `POST /api/auth/login`: Inicio de sesión (retorna `accessToken` de 15m y `refreshToken` de 7d).
- `POST /api/auth/refresh`: Renovación de tokens con rotación de refresh token y Absolute Lifetime.
- `POST /api/auth/logout`: Cierre de sesión e invalidación inmediata (`tokenVersion`).
- `GET /api/auth/perfil`: Consulta de datos del usuario autenticado (`Bearer Token`).

### 📂 Categorías (`/api/categories`)
- `POST /api/categories`: Crear categoría (con validación de duplicados insensible a mayúsculas).
- `GET /api/categories`: Listar categorías activas con conteo relacional de productos (`productsCount`).
- `GET /api/categories/:id`: Detalle de una categoría por UUID.
- `PUT /api/categories/:id`: Actualizar nombre de categoría.
- `DELETE /api/categories/:id`: Soft delete protegido (bloquea eliminación si contiene productos asociados).

### 📦 Productos (`/api/products`)
- `POST /api/products`: Crear producto (soporte multipart con subida a Cloudinary o JSON directo).
- `GET /api/products`: Listado paginado con filtros (`search`, `categoryId`, `sortBy`, `sortOrder`).
- `GET /api/products/:id`: Detalle de producto con su categoría asociada.
- `PUT /api/products/:id`: Actualizar producto con soporte de reemplazo de imagen.
- `DELETE /api/products/:id`: Eliminación lógica (Soft Delete mediante `@DeleteDateColumn`).

### 🌐 Catálogo Público (`/api/publico`)
- `GET /api/publico/productos`: Endpoint público optimizado sin autenticación para el consumo de la Landing Page en Next.js.

---

## 🧪 Scripts Disponibles

```bash
# Ejecutar en modo desarrollo con recarga en caliente
pnpm dev

# Sembrar categorías y productos de prueba en COP
pnpm seed

# Verificar tipos estrictos de TypeScript
pnpm typecheck

# Compilar proyecto para producción
pnpm build

# Iniciar bundle de producción
pnpm start
```

---

## 👨‍💻 Autor

Desarrollado con altos estándares de arquitectura por **Camilo Puche**.
