# Especificación de Arquitectura 02 · Base de Datos, Entidades y Soft Delete

**Fase:** Configuración de Base de Datos y Modelado de Entidades
**Rama:** `chore/database-config`
**Estado:** Completado
**Revisión:** Equipo de Ingeniería Vyrtium

---

## 1. Contexto y Necesidad Técnica

El sistema requiere persistencia relacional estricta para gestionar usuarios con credenciales seguras, categorías de productos y catálogo de productos con imágenes, precios y control de stock.

Para garantizar trazabilidad, auditoría y evitar la pérdida accidental de datos en operaciones comerciales, se requiere un esquema relacional donde **ningún registro se elimine físicamente de la base de datos** (Soft Delete), protegiendo la integridad referencial.

---

## 2. Decisiones de Arquitectura (ADR)

### ADR 02.1: TypeORM 0.3 DataSource con PostgreSQL
- **Decisión:** Configurar `AppDataSource` como un singleton desacoplado en `src/config/database.ts` utilizando el driver `pg` sobre PostgreSQL.
- **Justificación:** PostgreSQL ofrece soporte nativo para UUIDs, transacciones ACID completas y tipos de datos robustos (`timestamptz`, `numeric`, `text`).
- **Compromiso:** Se requiere inicializar la conexión asíncronamente antes de recibir tráfico en el servidor HTTP.

### ADR 02.2: Identificadores Únicos Universales (UUID v4) como Llave Primaria
- **Decisión:** Todas las tablas (`users`, `categories`, `products`) utilizan `id` tipo UUID v4 generado automáticamente (`@PrimaryGeneratedColumn('uuid')`).
- **Justificación:** Previene ataques de enumeración secuencial de recursos en la API pública/privada (evita predecir IDs como `/api/products/1`, `/api/products/2`), facilita la replicación entre ambientes y elimina colisiones.

### ADR 02.3: Soft Delete Universal con `@DeleteDateColumn()`
- **Decisión:** Implementar la columna `deleted_at` (`timestamptz`, nullable) en todas las entidades (`User`, `Category`, `Product`).
- **Justificación:** 
  1. Permite recuperar registros borrados por error o auditar el historial de bajas.
  2. TypeORM inyecta automáticamente la condición `WHERE deleted_at IS NULL` en todas las consultas de lectura (`find`, `findOne`, `createQueryBuilder`), haciendo el soft delete transparente para la capa de servicios.

### ADR 02.4: Integridad Referencial con Restricción Estricta (`ON DELETE RESTRICT`)
- **Decisión:** La relación entre `Product` y `Category` (`Product N -> 1 Category`) se define con `onDelete: 'RESTRICT'`.
- **Justificación:** Impide que una categoría con productos activos sea eliminada por accidente, obligando al sistema a responder con un error explícito (HTTP 409 Conflict) en lugar de dejar productos huérfanos o eliminarlos en cascada de forma destructiva.

### ADR 02.5: Precisión Monetaria con Columna `numeric(10,2)` y Transformador
- **Decisión:** El precio del producto se define como `numeric(10, 2)` en PostgreSQL con un transformador bidireccional (`transformer: { to: (v) => v, from: (v) => parseFloat(v) }`).
- **Justificación:** Los tipos `float` o `double` sufren de errores de redondeo de punto flotante en cálculos financieros. PostgreSQL `numeric` almacena valores decimales exactos y el transformador garantiza que TypeScript reciba un `number` en lugar de un `string`.

### ADR 02.6: Restricciones a Nivel de Motor (Check Constraints)
- **Decisión:** Agregar `@Check('"price" > 0')` y `@Check('"stock" >= 0')` en la entidad `Product`.
- **Justificación:** Aplica el principio de *Defensa en Profundidad*. Aunque Zod valide en el middleware HTTP, el motor de base de datos es la última línea de defensa que garantiza matemáticamente que ningún registro corrupto pueda persistirse bajo ninguna circunstancia.

---

## 3. Modelo de Entidades y Componentes Implementados

| Componente | Ruta | Responsabilidad |
|---|---|---|
| Configuración DataSource | `src/config/database.ts` | Configuración de conexión TypeORM, entidades, migraciones y SSL |
| Entidad Usuario | `src/entities/User.ts` | Tabla `users` (id, email, password_hash, created_at, deleted_at) |
| Entidad Categoría | `src/entities/Category.ts` | Tabla `categories` (id, name, created_at, deleted_at, relación OneToMany con productos) |
| Entidad Producto | `src/entities/Product.ts` | Tabla `products` (id, name, description, price, stock, image_url, category_id, ManyToOne con Category, created_at, deleted_at) |
| Arranque DB | `src/index.ts` | Inicialización de `AppDataSource.initialize()` previa al listen de Express |

---

## 4. Criterios de Aceptación y Verificación

- `pnpm typecheck` (`tsc --noEmit`) compila limpiamente sin errores de tipos.
- Todas las entidades contienen decoradores `@DeleteDateColumn` para soporte de soft delete nativo.
- La conexión a la base de datos se inicializa correctamente al arrancar el servidor.
