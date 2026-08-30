# Especificación de Arquitectura 06 · Sistema de Notificaciones (Strategy Pattern + Resend)

**Fase:** Sistema de Notificaciones y Email de Bienvenida  
**Rama:** `feat/email-notifications`  
**Estado:** Completado  
**Revisión:** Equipo de Ingeniería Vyrtium  

---

## 1. Contexto y Necesidad Técnica

Como requerimiento de valor agregado (Bonus), la plataforma debe emitir un correo electrónico transaccional de bienvenida al registrarse un nuevo usuario. 

Para evitar acoplar la lógica de autenticación directamente al SDK de un proveedor específico (ej. Resend), se implementó un motor de notificaciones desacoplado basado en el **Patrón Strategy**, con catálogo centralizado de plantillas, mapeo declarativo de variables por canal y soporte para múltiples proveedores de transporte (`EMAIL`, `SMS`, `WHATSAPP`, `PUSH`).

Asimismo, para personalizar las notificaciones y enriquecer la experiencia de usuario, se incorporó el campo `name` obligatorio en la entidad `User` y en el flujo de registro/autenticación.

---

## 2. Decisiones de Arquitectura (ADR)

### ADR 06.1: Patrón Strategy para Transporte de Mensajes
- **Decisión:** Definir la interfaz `NotificationStrategy` con el método `send(payload)` y desacoplar los adaptadores de transporte (`ResendEmailStrategy`).
- **Justificación:** Permite incorporar nuevos canales o cambiar de proveedor de email (ej. SendGrid, Mailrelay, AWS SES) sin modificar los servicios de negocio (`AuthService`).

### ADR 06.2: Catálogo Jerárquico con Mapeo Declarativo de Variables
- **Decisión:** Estructurar las plantillas en un catálogo jerárquico `NOTIFICATION_TEMPLATES[NOMBRE_CASO][SUBCASO]` (ej. `USER_NOTIFICATIONS.REGISTRO_DE_USUARIO`), donde cada subcaso define un bloque por proveedor (`EMAIL`, `WHATSAPP`, `SMS`) con su diccionario `data` y función de renderizado.
- **Justificación:** Centraliza el diseño visual y el copy transaccional, garantizando que cada canal reciba solo las variables mapeadas e interpoladas que necesita.

### ADR 06.3: Despacho Asíncrono No Bloqueante (Non-Blocking Fire & Forget)
- **Decisión:** Disparar `notificationService.send()` de forma asíncrona dentro de `AuthService.register()` con captura de excepciones aislada.
- **Justificación:** Garantiza que la respuesta HTTP del registro sea ultra rápida (<200ms) y que cualquier fallo o latencia en el proveedor de correo nunca aborte ni demore el registro en base de datos.

### ADR 06.4: Modo Simulado Seguro en Desarrollo
- **Decisión:** Si `RESEND_API_KEY` no está configurada o contiene un placeholder, `ResendEmailStrategy` emite un log informativo con Pino y simula el envío con éxito.
- **Justificación:** Permite a evaluadores y desarrolladores probar el registro localmente sin necesidad obligatoria de una API Key activa de Resend.

### ADR 06.5: Personalización con Campo `name` en `User`
- **Decisión:** Incorporar la columna `name` (`varchar(150)`, `NOT NULL`) en la entidad `User`, requerida en `registerSchema` y expuesta en `RegisterResponse`, `AuthResponse` y `req.user`.
- **Justificación:** Permite personalizar la plantilla de bienvenida ("¡Hola, {name}!") y provee el nombre del usuario autenticado para el panel administrativo y frontend.

---

## 3. Estructura del Sistema de Notificaciones

```text
src/utils/notifications/
├── notification.constants.ts   # Enums y constantes maestras (NOTIFICATION_TEMPLATES_NAMES, USER_NOTIFICATIONS_NAMES)
├── interfaces/
│   ├── strategy.interface.ts   # Contratos de adaptadores (NotificationStrategy, NotificationResult)
│   └── template.interface.ts   # Tipos de plantillas y catálogo maestro multicanal con bloque data
├── strategies/
│   └── resend-email.strategy.ts# Adaptador de envío vía Resend SDK
├── user/
│   ├── emails/
│   │   └── welcome.email.ts    # Plantilla HTML/Texto responsiva de bienvenida
│   └── user.template.ts        # Definición de USER_NOTIFICATIONS con bloque EMAIL (extensible a WHATSAPP, SMS)
├── templates/
│   └── index.ts                # Registro maestro NOTIFICATION_TEMPLATES
├── notification.utils.ts       # Motor de interpolación de variables {variable}
└── notification.service.ts     # Dispatcher central / Contexto del Strategy
```

---

## 4. Componentes Implementados

| Componente | Ruta | Responsabilidad |
|---|---|---|
| Constantes de Nombres | `src/utils/notifications/notification.constants.ts` | Enums de casos y subcasos para acceso tipado dinámico |
| Interfaz Estrategia | `src/utils/notifications/interfaces/strategy.interface.ts` | Contrato de proveedores de transporte |
| Interfaz Plantillas | `src/utils/notifications/interfaces/template.interface.ts` | Contrato de definición de plantillas y mapeo `data` |
| Utilidades | `src/utils/notifications/notification.utils.ts` | Interpolador de variables en strings |
| Estrategia Resend | `src/utils/notifications/strategies/resend-email.strategy.ts` | Adaptador para la API de Resend |
| Plantilla Bienvenida | `src/utils/notifications/user/emails/welcome.email.ts` | HTML responsivo y texto plano con diseño SaaS minimalista |
| Plantilla de Usuario | `src/utils/notifications/user/user.template.ts` | Definición de `USER_NOTIFICATIONS.REGISTRO_DE_USUARIO` con bloque `EMAIL` |
| Catálogo Maestro | `src/utils/notifications/templates/index.ts` | Registro maestro indexado por constante |
| Servicio Dispatcher | `src/utils/notifications/notification.service.ts` | Orquestador de estrategias, interpolación de `data` y renderizado |
| Disparador de Negocio | `src/modules/auth/auth.service.ts` | Invocación en `AuthService.register()` |

---

## 5. Criterios de Aceptación y Verificación

- `pnpm typecheck` (`tsc --noEmit`) pasa sin ningún error de tipos.
- Registrar un usuario con `name`, `email` y `password` en `POST /api/auth/registro` guarda el nombre en PostgreSQL.
- Dispara la notificación de bienvenida con el nombre personalizado `{name}`.
- Con `RESEND_API_KEY` configurada, envía el correo real con diseño SaaS minimalista a la bandeja del usuario.
- Sin `RESEND_API_KEY`, registra en el log estructurado de Pino el intento simulado sin fallar la petición HTTP.
