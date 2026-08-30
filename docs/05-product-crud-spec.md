# Especificación de Arquitectura 05 · CRUD de Productos y Catálogo Público

**Fase:** Gestión de Productos y Catálogo Público
**Rama:** `feat/product-crud`
**Estado:** Completado
**Revisión:** Equipo de Ingeniería Vyrtium

---

## 1. Contexto y Necesidad Técnica

El catálogo de productos constituye el núcleo comercial del sistema. Este módulo implementa la gestión integral de productos para el panel privado de administración (creación, edición, listado paginado con filtros, eliminación con soft-delete y subida de imágenes) y provee el endpoint público optimizado para alimentar la landing page en Next.js.

---

## 2. Decisiones de Arquitectura (ADR)

### ADR 05.1: Almacenamiento de Imágenes en Cloudinary con Multer en Memoria
- **Decisión:** Configurar Multer con `memoryStorage()` para procesar archivos binarios en memoria y transmitirlos directamente a Cloudinary mediante `upload_stream`.
- **Justificación:** Evita escribir archivos temporales en el sistema de archivos del servidor (crucial para entornos serverless y contenedores Docker efímeros) y aprovecha la CDN global de Cloudinary con transformaciones automáticas de formato y calidad (`auto-quality`, `auto-format`).

### ADR 05.2: Soporte Dual Multipart/Form-Data y JSON con Coerción en Zod
- **Decisión:** Utilizar `z.coerce.number()` en los esquemas de Zod (`createProductSchema`, `updateProductSchema`).
- **Justificación:** Cuando el frontend envía formularios con archivos (`multipart/form-data`), los campos como `price` y `stock` llegan como strings. La coerción de Zod permite parsear tanto payloads `multipart` como `application/json` puro sin duplicar controladores.

### ADR 05.3: Paginación Dinámica y Filtros Combinados
- **Decisión:** Implementar paginación (`page`, `limit`), búsqueda de texto (`search` con `ILIKE` en nombre y descripción), filtro por categoría (`categoryId`) y ordenamiento configurable (`sortBy`, `sortOrder`).
- **Justificación:** Garantiza un rendimiento óptimo de base de datos a escala mediante `.skip()` y `.take()`, retornando metadatos completos (`total`, `page`, `limit`, `totalPages`).

### ADR 05.4: Endpoint Público Desacoplado para la Landing (`GET /api/publico/productos`)
- **Decisión:** Exponer `GET /api/publico/productos` bajo un router público sin middleware `authenticateJwt`.
- **Justificación:** Cumple el requisito explícito de la prueba técnica permitiendo que la landing page consuma el catálogo de forma anónima con alta velocidad de respuesta.

### ADR 05.5: Segregación Estricta de Interfaces
- **Decisión:** Todos los DTOs de salida y estructuras de paginación residen exclusivamente en `src/modules/products/product.interface.ts`.
- **Justificación:** Cumple con la directriz de arquitectura de [.agents/.rules/AGENTS.md].

---

## 3. Contrato de Endpoints

### Endpoints Privados (`Authorization: Bearer <accessToken>`)

| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `POST` | `/api/products` | Crea producto con soporte de subida de imagen (Multer/Cloudinary) o JSON | `201`, `400`, `401`, `404` |
| `GET` | `/api/products` | Listado paginado con filtros (`search`, `categoryId`, `sortBy`, `sortOrder`) | `200`, `401` |
| `GET` | `/api/products/:id` | Detalle completo de un producto con su categoría asociada | `200`, `401`, `404` |
| `PUT` | `/api/products/:id` | Actualización de producto con soporte de nueva imagen | `200`, `400`, `401`, `404` |
| `DELETE` | `/api/products/:id` | Soft delete de producto (`deleted_at`) | `200`, `401`, `404` |

### Endpoint Público (Sin Autenticación)

| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `GET` | `/api/publico/productos` | Catálogo público paginado para la Landing Page | `200` |

---

## 4. Componentes Implementados

| Componente | Ruta | Responsabilidad |
|---|---|---|
| Servicio Cloudinary | `src/utils/cloudinary.ts` | Configuración SDK y subida vía streams |
| Middleware Multer | `src/middlewares/upload.middleware.ts` | Validación de tipos MIME y límite de 5MB en memoria |
| Interfaces | `src/modules/products/product.interface.ts` | Contratos tipados (`ProductResponse`, `PaginatedProductsResponse`, etc.) |
| Esquemas Zod | `src/modules/products/product.schema.ts` | Validadores de entrada con coerción de tipos |
| Servicio | `src/modules/products/product.service.ts` | Lógica de negocio, paginación, filtros y persistencia |
| Controlador | `src/modules/products/product.controller.ts` | Manejador HTTP delgado desacoplado |
| Enrutador Privado | `src/modules/products/product.routes.ts` | Rutas protegidas con Swagger OpenAPI 3.0 |
| Enrutador Público | `src/modules/products/public.routes.ts` | Ruta pública para la Landing Page |

---

## 5. Criterios de Aceptación y Verificación

- `pnpm typecheck` (`tsc --noEmit`) pasa sin ningún error de tipos.
- `GET /api/publico/productos` responde `200 OK` sin requerir token JWT.
- `POST /api/products` valida que `price > 0`, `stock >= 0` y que la categoría exista.
- `GET /api/products` responde datos paginados con metadatos (`total`, `page`, `limit`, `totalPages`).
- `DELETE /api/products/:id` aplica soft delete (`deleted_at`).
