export const NOTIFICATION_TEMPLATES_NAMES = {
  USER_NOTIFICATIONS: 'USER_NOTIFICATIONS',
} as const;

export const USER_NOTIFICATIONS_NAMES = {
  REGISTRO_DE_USUARIO: 'REGISTRO_DE_USUARIO',
} as const;

export type NotificationTemplateName =
  (typeof NOTIFICATION_TEMPLATES_NAMES)[keyof typeof NOTIFICATION_TEMPLATES_NAMES];

export type UserNotificationSubcaseName =
  (typeof USER_NOTIFICATIONS_NAMES)[keyof typeof USER_NOTIFICATIONS_NAMES];
