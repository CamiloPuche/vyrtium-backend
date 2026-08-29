# Vyrtium Backend — Reglas y Guías de Arquitectura

Este documento establece los principios de arquitectura, estándares de código y reglas de flujo de trabajo para desarrolladores y agentes de IA en `vyrtium-backend`.

---

## 1. Filosofía Central: Arquitectura Modular por Capas

Mantenemos una **Arquitectura Modular** agrupada por dominio:
- `src/modules/<nombre-modulo>/`: Cada módulo es autónomo.
  - `*.controller.ts`: Maneja exclusivamente peticiones y respuestas HTTP. Llama al Service. Nunca accede a la BD directamente.
  - `*.service.ts`: Implementa las reglas de negocio, validaciones, transformaciones y orquestación.
  - `*.repository.ts`: Wrapper sobre TypeORM. Abstrae los detalles de persistencia y consultas.
  - `*.routes.ts`: Router de Express que asocia ruta, middlewares y método del controller.
  - `*.schema.ts`: Esquemas de Zod para validación de entrada (DTOs).

### Reglas Inviolables de Capas
1. **Controladores delgados (Thin Controllers)**: Cero consultas SQL, cero bifurcaciones complejas, cero lógica de negocio.
2. **Servicios agnósticos del framework**: Los servicios NO reciben objetos `req` ni `res`. Reciben datos planos y retornan DTOs o lanzan `AppError`.
3. **Sin fugas del ORM**: La lógica de negocio interactúa con repositorios, no con SQL directo en los controladores.
4. **Soft Delete Universal**: Los borrados duros (`DELETE FROM`) están estrictamente prohibidos. Se usa `@DeleteDateColumn()` de TypeORM y `.softDelete()`.

---

## 2. Estándar de Manejo de Errores y Logging

- Usar la clase `AppError` (`src/errors/AppError.ts`) para todos los errores operativos y de negocio (400, 401, 403, 404, 409).
- Nunca exponer errores crudos de base de datos ni stack traces al cliente.
- Todo endpoint asíncrono debe asegurar que los errores lleguen al middleware global `errorHandler`.
- **Prohibido `console.log` / `console.error`**: Usar siempre el singleton `logger` desde `src/utils/logger.ts` (`logger.info()`, `logger.warn()`, `logger.error()`).

```typescript
// Correcto:
throw new AppError(404, 'Categoría no encontrada');
logger.info('Producto creado exitosamente');

// Incorrecto:
console.log('Creando producto...');
res.status(500).json({ error: 'Fallo BD: ' + err.message });
```

---

## 3. Estándares de Validación y Tipado

- **Validación en la frontera**: Todo endpoint POST, PUT y PATCH debe validar `req.body` mediante esquemas de Zod en el middleware `validate`.
- **TypeScript Estricto**: `noImplicitAny: true`, `noUncheckedIndexedAccess: true`. Prohibido el uso de `any`. Usar tipos concretos, genéricos o `unknown`.
- **Limpieza de código**: Eliminar imports sin usar y código muerto antes de entregar.

---

## 4. Disciplina de Git y Convenciones

1. **Estructura de ramas**:
   - `main`: Código listo para producción.
   - `develop`: Rama de integración.
   - `feat/<nombre>`, `fix/<nombre>`, `chore/<nombre>`, `docs/<nombre>`: Ramas de trabajo.
2. **Conventional Commits**:
   - Prefijos: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
   - Commits atómicos y descriptivos.
   - Sin etiquetas de atribución automática.
3. **Criterio de Aceptación (Definition of Done)**:
   - Compilación limpia con `pnpm typecheck` (`tsc --noEmit`).
   - Documentación OpenAPI/Swagger actualizada para cada endpoint nuevo.
   - Especificación / ADR documentada en `docs/`.

---

## 5. Lista de Seguridad

- Passwords hasheadas con `bcrypt` (salt rounds: 12).
- JWT firmado con clave secreta fuerte y tiempo de expiración definido.
- `helmet` habilitado para cabeceras HTTP seguras.
- CORS restringido mediante variables de entorno.
- Variables sensibles nunca se versionan en Git.
