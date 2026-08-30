# Especificación de Arquitectura 03 · Módulo de Autenticación (Dual Token: Access + Refresh)

**Fase:** Autenticación y Autorización
**Rama:** `feat/auth-endpoints`
**Estado:** Completado
**Revisión:** Equipo de Ingeniería Vyrtium

---

## 1. Contexto y Necesidad Técnica

Para proteger los recursos comerciales (gestión de categorías y productos) y delimitar el acceso privado de la landing pública, el sistema requiere un mecanismo de autenticación robusto basado en estándares de la industria (RFC 7519 JSON Web Tokens).

El módulo debe garantizar el almacenamiento seguro de credenciales, la emisión y validación de tokens de sesión con ciclo de vida corto (`15m` Access Token), rotación segura de Refresh Tokens (`7d`) con persistencia en base de datos e invalidación inmediata (Logout).

---

## 2. Decisiones de Arquitectura (ADR)

### ADR 03.1: Cifrado Unidireccional con Bcrypt (Salt Rounds: 12)
- **Decisión:** Almacenar las contraseñas utilizando `bcrypt` con un costo computacional de `saltRounds: 12`.
- **Justificación:** Previene ataques de fuerza bruta y tablas arcoíris (rainbow tables). El costo 12 añade ~200ms por verificación, imperceptible para usuarios legítimos pero prohibitivamente costoso para atacantes automatizados.
- **Regla:** La contraseña en texto plano nunca se persiste, nunca se loguea y nunca se retorna en ninguna respuesta de la API.

### ADR 03.2: Arquitectura Dual Token (Access Token 15m + Refresh Token 7d)
- **Decisión:** Emplear una arquitectura de dos tokens:
  1. `accessToken`: firmado con `JWT_SECRET`, vida útil de 15 minutos, enviado en la cabecera `Authorization: Bearer <token>`.
  2. `refreshToken`: firmado con `JWT_REFRESH_SECRET`, vida útil de 7 días, utilizado exclusivamente en `POST /api/auth/refresh`.
- **Justificación:** Minimiza la ventana de exposición en caso de intercepción del access token y permite revocar sesiones de forma selectiva.

### ADR 03.3: Rotación de Refresh Tokens y Almacenamiento Cifrado en BD
- **Decisión:** Almacenar el hash (`bcrypt`) del Refresh Token activo en la columna `refresh_token_hash` de la entidad `User`. En cada invocación de `/api/auth/refresh`, se invalida el token actual y se emite un nuevo par (Token Rotation).
- **Justificación:** Detecta intentos de reutilización de tokens robados e impide que una fuga de lectura en la base de datos exponga tokens de sesión utilizables.

### ADR 03.4: Mitigación de Enumeración de Usuarios en Login
- **Decisión:** Tanto si el correo no existe en la base de datos como si la contraseña es incorrecta, el endpoint `POST /api/auth/login` responde con el mismo código de estado (`401 Unauthorized`) y mensaje genérico (`"Credenciales inválidas"`).
- **Justificación:** Evita que un atacante deduzca qué correos electrónicos están registrados en la plataforma analizando las diferencias en las respuestas de error.

### ADR 03.5: Middleware Genérico de Validación con Zod
- **Decisión:** Crear `validate(schema)` (`src/middlewares/validate.middleware.ts`) que intercepta `req.body` antes del controlador y delega errores a `errorHandler`.
- **Justificación:** Centraliza la validación en la frontera de entrada, manteniendo los controladores limpios y libres de código repetitivo de validación manual.

### ADR 03.6: Extensión de Tipos de Express para `req.user`
- **Decisión:** Augmentar la interfaz `Express.Request` en `src/types/express.d.ts` con la propiedad tipada `user?: { id: string; email: string }`.
- **Justificación:** Proporciona autocompletado y verificación estricta de tipos en TypeScript dentro de cualquier controlador protegido por `authenticateJwt`, sin necesidad de castear con `(req as any).user`.

### ADR 03.7: Segregación de Interfaces en Archivos Dedicados (`*.interface.ts`)
- **Decisión:** Extraer todas las interfaces de contratos de respuesta, DTOs tipados y payloads (`AuthResponse`, `RegisterResponse`, `JwtPayload`, `AuthTokens`) al archivo `src/modules/auth/auth.interface.ts`.
- **Justificación:** Previene la contaminación de servicios y controladores con declaraciones de tipos, asegura una única fuente de verdad para los contratos y evita dependencias circulares.

### ADR 03.8: Revocación Inmediata con el Patrón `tokenVersion`
- **Decisión:** Añadir el claim `tokenVersion` en el payload del `accessToken` y sincronizarlo con la columna `token_version` de la entidad `User`. En cada operación de `logout` o renovación por rotación (`refresh`), se incrementa `token_version += 1` y se anula `refreshTokenHash`.
- **Justificación:** Resuelve la limitación de los JWTs tradicionales sin estado (stateless) eliminando la ventana de vida residual. Al hacer logout o rotar, cualquier token anterior queda inmediatamente invalidado con código `401 Unauthorized`.

### ADR 03.9: Vida Absoluta de Sesión (Absolute Session Lifetime) vs Ventana Deslizante
- **Decisión:** En cada invocación de `POST /api/auth/refresh`, el nuevo Refresh Token emitido hereda el timestamp de expiración original (`payload.exp`) del login inicial en lugar de reiniciar un nuevo periodo de 7 días.
- **Justificación:** Evita que sesiones inactivas o comprometidas se perpetúen indefinidamente y garantiza que cada 7 días el usuario deba reautenticarse explícitamente mediante credenciales.

---

## 3. Contrato de Endpoints

| Método | Ruta | Acceso | Descripción | Códigos HTTP |
|---|---|---|---|---|
| `POST` | `/api/auth/registro` | Público | Registra usuario con email y password hasheada | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | Público | Autentica credenciales y devuelve par de tokens (`accessToken` + `refreshToken`) | `200`, `400`, `401` |
| `POST` | `/api/auth/refresh` | Público | Renueva el par de tokens aplicando rotación de Refresh Token | `200`, `400`, `401` |
| `POST` | `/api/auth/logout` | Privado (`Bearer`) | Invalida el Refresh Token del usuario en la base de datos | `200`, `401` |
| `GET` | `/api/auth/perfil` | Privado (`Bearer`) | Retorna los datos del usuario autenticado a partir del Access Token | `200`, `401` |

---

## 4. Componentes Implementados

| Componente | Ruta | Responsabilidad |
|---|---|---|
| Middleware de Validación | `src/middlewares/validate.middleware.ts` | Valida esquemas Zod en `req.body` |
| Middleware de Auth | `src/middlewares/auth.middleware.ts` | Verifica JWT Bearer, valida existencia en DB y adjunta `req.user` |
| Esquemas DTO | `src/modules/auth/auth.schema.ts` | Esquemas Zod para registro, login y refresh token |
| Interfaces del Módulo | `src/modules/auth/auth.interface.ts` | Tipos y contratos de respuesta tipados del dominio auth |
| Servicio Auth | `src/modules/auth/auth.service.ts` | Lógica de negocio (bcrypt cost 12, rotación de tokens, logout, sign JWT) |
| Controlador Auth | `src/modules/auth/auth.controller.ts` | Adaptador HTTP que responde JSON estructurado |
| Enrutador Auth | `src/modules/auth/auth.routes.ts` | Rutas con documentación Swagger / OpenAPI 3.0 |
| Tipos Globales | `src/types/express.d.ts` | Tipado de `req.user` en Express |

---

## 5. Criterios de Aceptación y Verificación

- `pnpm typecheck` (`tsc --noEmit`) pasa sin ningún error de tipos.
- `POST /api/auth/registro` crea usuario y rechaza duplicados con 409.
- `POST /api/auth/login` valida contraseña con bcrypt y entrega `accessToken` (15m) y `refreshToken` (7d).
- `POST /api/auth/refresh` valida el refresh token en BD, emite un nuevo par de tokens y rota el hash persistido.
- `POST /api/auth/logout` anula el `refresh_token_hash` impidiendo renovaciones posteriores.
- `GET /api/auth/perfil` rechaza peticiones sin token (401) y responde con éxito (200) cuando se envía `Authorization: Bearer <accessToken>`.
- Swagger en `/api/docs` incluye los 5 endpoints documentados con schemas y tags.

---

## 6. Evolución del Módulo

- **Personalización con campo `name`:** Durante la fase del sistema de notificaciones (`feat/email-notifications`), se incorporó el campo `name` obligatorio (`varchar(150)`) en la entidad `User`, en el validador `registerSchema`, en `req.user` y en los contratos de respuesta para permitir la personalización de las plantillas transaccionales de bienvenida. Para consultar los detalles y decisiones arquitectónicas de esta extensión, ver [docs/06-notifications-spec.md].
