# Especificación de Arquitectura 01 · Scaffolding, Herramientas Base y Estándares

**Fase:** Configuración Inicial del Proyecto
**Rama:** `chore/project-setup`
**Estado:** Completado
**Revisión:** Equipo de Ingeniería Vyrtium

---

## 1. Contexto y Necesidad Técnica

Para construir una API escalable, mantenible y lista para producción en el sistema de productos y categorías de Vyrtium, se requiere una base sólida con Node.js 24 LTS, TypeScript, pnpm y Express.

Una estructura desordenada o sin tipado estricto genera cuellos de botella, errores en runtime y despliegues frágiles. Esta fase establece el compilador estricto, la gestión de dependencias con pnpm, la inicialización de Express, los endpoints de salud, la infraestructura de Swagger y las directrices del equipo.

---

## 2. Decisiones de Arquitectura (ADR)

### ADR 01.1: TypeScript con Configuración Estricta
- **Decisión:** Habilitar TypeScript 5 con `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true` y target ES2022.
- **Justificación:** Previene errores de punteros nulos y accesos indefinidos en tiempo de compilación. Asegura compatibilidad moderna de JavaScript sin sobrecarga innecesaria.
- **Compromiso:** Mayor rigor inicial al programar a cambio de seguridad de tipos absoluta y cero sorpresas en producción.

### ADR 01.2: Separación entre Configuración de la App y Servidor
- **Decisión:** Separar `src/app.ts` (configuración de middlewares, Swagger, rutas y manejador de errores) de `src/index.ts` (conexión a base de datos y `app.listen()`).
- **Justificación:** Permite pruebas de integración (Supertest) sin levantar puertos reales y desacopla el ciclo de vida del servidor de la definición de rutas.

### ADR 01.3: Documentación Interactiva OpenAPI / Swagger
- **Decisión:** Integrar `swagger-ui-express` y `swagger-jsdoc` en la ruta `/api/docs`.
- **Justificación:** Una API autodocumentada permite al equipo de frontend y a los evaluadores probar los endpoints interactivamente sin depender de colecciones manuales de Postman.

### ADR 01.4: Estructura Modular por Dominio
- **Decisión:** Organizar el código bajo `src/modules/<dominio>` agrupando controlador, servicio, repositorio, rutas y esquemas de validación por cada entidad de negocio.
- **Justificación:** Facilita la navegación, evita dispersión entre carpetas globales y permite evolucionar o desacoplar módulos fácilmente.

### ADR 01.5: Logging Estructurado con Pino y Pino-HTTP
- **Decisión:** Prohibir el uso de `console.log` directo y adoptar `pino` con `pino-pretty` para desarrollo y formato JSON estructurado en producción, integrando `pino-http` para trazabilidad de peticiones.
- **Justificación:** `console.log` es síncrono y bloqueante bajo alta concurrencia, carece de niveles de severidad (`info`, `warn`, `error`) y no es indexable en herramientas de observabilidad en la nube.

### ADR 01.6: Ejecutor de Desarrollo con `tsx`
- **Decisión:** Usar `tsx watch`.
- **Justificación:** `tsx` ejecuta TypeScript en memoria mediante `esbuild` de forma nativa en Node 24 sin fricciones de configuración, soporta watch mode en caliente y es 10x más rápido.

---

## 3. Componentes Implementados

| Componente | Ruta | Responsabilidad |
|---|---|---|
| Configuración de Paquetes | `package.json` + `pnpm-lock.yaml` | Dependencias, scripts (`dev`, `build`, `typecheck`, `migration:*`) |
| Compilador TS | `tsconfig.json` | Reglas estrictas y soporte de decoradores para TypeORM |
| Reglas de Arquitectura | `.agents/.rules/AGENTS.md` | Guías de capas, manejo de errores, seguridad y convenciones |
| Logger Estructurado | `src/utils/logger.ts` | Singleton de Pino y middleware de logging HTTP |
| Inicialización de Express | `src/app.ts` | Middlewares globales (Helmet, CORS, JSON, Pino-HTTP), Swagger, `/health` y `errorHandler` |
| Punto de Entrada | `src/index.ts` | Ciclo de vida y arranque del servidor HTTP |
| Documentación Swagger | `src/config/swagger.ts` | Configuración OpenAPI 3.0 |
| Manejo de Errores | `src/errors/AppError.ts` + `errorHandler.ts` | Clase de error operativo y captura global de `AppError`, `ZodError` y 500s |
| Health Check | `GET /health` | Endpoint de verificación de estado y disponibilidad del servicio |

---

## 4. Criterios de Aceptación y Verificación

- `pnpm typecheck` (`tsc --noEmit`) pasa sin ningún error ni advertencia.
- `GET /health` responde 200 con `{ "status": "ok", "timestamp": "..." }`.
- `GET /api/docs` renderiza la interfaz interactiva de Swagger UI.
