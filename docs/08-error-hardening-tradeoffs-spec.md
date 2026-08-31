# Especificación de Arquitectura 08 · Trade-offs de Robustez, Límites Numéricos y Resiliencia de Errores

**Fase:** Hardening & Resiliencia en Producción
**Rama:** `fix/error-handling-and-bounds`
**Estado:** Completado
**Módulos Afectados:**
- [01-scaffolding-spec.md](01-scaffolding-spec.md) (Manejo Global de Errores)
- [05-product-crud-spec.md](05-product-crud-spec.md) (Validación de Esquemas Zod)

---

## 1. Contexto y Trade-offs Identificados

Durante las pruebas de estrés en el entorno de producción (PostgreSQL en la nube), se identificó un escenario de desbordamiento de enteros al enviar un stock superior a `2.147.483.647` o precios con más de 10 dígitos. PostgreSQL arrojaba el error `22003 (numeric_value_out_of_range / integer out of range)`, el cual no era interceptado por la capa de middleware y provocaba respuestas `500 Internal Server Error` sin información útil para el cliente.

---

## 2. Decisiones de Arquitectura (ADR)

### ADR 08.1: Límites Superiores Explícitos en Esquemas Zod
- **Decisión:** Definir límites superiores realistas en los esquemas de validación de entrada (`product.schema.ts`):
  - `price`: Máximo `$99.999.999,99 COP` (`.max(99999999.99)`).
  - `stock`: Máximo `1.000.000 unidades` (`.max(1000000)`).
- **Trade-off:**
  - *Ventaja:* Las peticiones fuera de rango son rechazadas en la frontera HTTP con `400 Bad Request` antes de ejecutar queries en la base de datos.
  - *Compromiso:* Si un negocio requiere inventarios mayores a 1 millón o precios superiores a 100 millones COP, requeriría ajustar el esquema y la precisión de la columna (`numeric(12,2)` / `bigint`). Para el alcance comercial actual, 1M de unidades es holgado y seguro.

### ADR 08.2: Mapeo Centralizado de Códigos de Error de PostgreSQL y Multer
- **Decisión:** Extender `src/errors/errorHandler.ts` para interceptar códigos de error del driver de PostgreSQL (`QueryFailedError`) y excepciones de Multer:
  - **`22003` (Numeric Out of Range):** Retorna `400 Bad Request` (*"El valor numérico ingresado supera el límite permitido en la base de datos"*).
  - **`22P02` (Invalid Text Representation):** Retorna `400 Bad Request` (*"Formato de identificador o tipo de dato inválido"*).
  - **`23505` (Unique Violation):** Retorna `409 Conflict` (*"El registro ya existe con los mismos datos únicos"*).
  - **`23503` (Foreign Key Violation):** Retorna `409 Conflict` (*"La operación no se puede completar debido a restricciones de relaciones existentes"*).
  - **`23514` (Check Constraint Violation):** Retorna `400 Bad Request` (*"Los valores ingresados no cumplen con las reglas de validación de la base de datos"*).
  - **`MulterError (LIMIT_FILE_SIZE)`:** Retorna `400 Bad Request` (*"El archivo supera el tamaño máximo permitido de 5MB"*).
- **Trade-off:**
  - *Ventaja:* La API nunca filtra excepciones 500 no controladas ante errores de restricción de datos o archivos pesados.
  - *Compromiso:* Requiere mantener el catálogo de códigos SQL alineado si se migra de motor de base de datos.

---

## 3. Criterios de Aceptación y Verificación

- Intentos de creación con stock o precio gigantescos responden con `400 Bad Request` y mensajes amigables.
- Subidas de archivos mayores a 5MB responden con `400 Bad Request`.
- Todas las respuestas preservan el formato estándar `{ success: false, error: string }`.
