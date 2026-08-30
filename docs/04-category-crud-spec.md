# Especificación de Arquitectura 04 · CRUD de Categorías (Privado + Soft Delete)

**Fase:** Gestión de Categorías
**Rama:** `feat/category-crud`
**Estado:** Completado
**Revisión:** Equipo de Ingeniería Vyrtium

---

## 1. Contexto y Necesidad Técnica

Las categorías estructuran el catálogo de productos de la plataforma. Este módulo provee las operaciones CRUD completas bajo autenticación obligatoria (`Bearer accessToken`), garantizando que la eliminación lógica (`softDelete`) proteja la integridad relacional con los productos activos asociados.

---

## 2. Decisiones de Arquitectura (ADR)

### ADR 04.1: Validación Preventiva de Integridad Referencial en Soft Delete
- **Decisión:** Antes de ejecutar `softDelete` sobre una categoría, el servicio consulta si existen productos activos (`deleted_at IS NULL`) asociados a la categoría.
- **Justificación:** Si existen productos dependientes, se lanza un error de dominio `AppError(409, 'No se puede eliminar la categoría porque tiene N producto(s) asociado(s)')` en lugar de delegar el fallo a la base de datos o dejar productos huérfanos.

### ADR 04.2: Conteo Eficiente de Productos Asociados en Listados
- **Decisión:** En `GET /api/categories`, se utiliza `loadRelationCountAndMap` de TypeORM para mapear la propiedad `productsCount` filtrando productos no eliminados.
- **Justificación:** Evita el problema de consultas N+1 y provee métricas en tiempo real al panel de administración sin sobrecargar la memoria con la carga de todos los objetos de productos.

### ADR 04.3: Unicidad de Nombre Insensible a Mayúsculas/Minúsculas (`ILike`)
- **Decisión:** Validar la duplicidad de nombres de categorías utilizando operadores `ILike` de TypeORM tanto en la creación como en la edición (`Not(id)`).
- **Justificación:** Previene categorías duplicadas con variaciones de capitalización (ej. "Ropa" vs "ropa" vs "ROPA").

### ADR 04.4: Segregación Estricta de Interfaces
- **Decisión:** Todos los DTOs de salida residen exclusivamente en `src/modules/categories/category.interface.ts`.
- **Justificación:** Cumple con la directriz de arquitectura de [.agents/.rules/AGENTS.md].

---

## 3. Contrato de Endpoints

Todos los endpoints requieren la cabecera `Authorization: Bearer <accessToken>`.

| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| `POST` | `/api/categories` | Crea una nueva categoría con nombre único | `201`, `400`, `401`, `409` |
| `GET` | `/api/categories` | Lista todas las categorías activas con conteo de productos | `200`, `401` |
| `GET` | `/api/categories/:id` | Retorna el detalle de una categoría por UUID | `200`, `401`, `404` |
| `PUT` | `/api/categories/:id` | Actualiza el nombre de una categoría | `200`, `400`, `401`, `404`, `409` |
| `DELETE` | `/api/categories/:id` | Soft delete de categoría (valida que no tenga productos activos) | `200`, `401`, `404`, `409` |

---

## 4. Componentes Implementados

| Componente | Ruta | Responsabilidad |
|---|---|---|
| Interfaces | `src/modules/categories/category.interface.ts` | Contratos tipados (`CategoryResponse`, `CategoryDetailResponse`) |
| Esquemas Zod | `src/modules/categories/category.schema.ts` | Validadores de entrada (`createCategorySchema`, `updateCategorySchema`) |
| Servicio | `src/modules/categories/category.service.ts` | Lógica de negocio, conteo de relaciones y validaciones |
| Controlador | `src/modules/categories/category.controller.ts` | Manejador HTTP delgado desacoplado |
| Enrutador | `src/modules/categories/category.routes.ts` | Rutas protegidas con Swagger OpenAPI 3.0 |

---

## 5. Criterios de Aceptación y Verificación

- `pnpm typecheck` (`tsc --noEmit`) pasa sin ningún error de tipos.
- Intentar acceder sin token `Bearer` responde `401 Unauthorized`.
- `POST /api/categories` crea categoría y rechaza duplicados con `409 Conflict`.
- `GET /api/categories` retorna lista con `productsCount`.
- `DELETE /api/categories/:id` elimina lógicamente (`deleted_at != null`) si no tiene productos, y responde `409` si tiene productos activos.
