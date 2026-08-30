import { USER_NOTIFICATIONS_NAMES } from '../notification.constants';
import { SubcaseTemplates } from '../interfaces/template.interface';
import { welcomeEmailTemplate } from './emails/welcome.email';

export const USER_NOTIFICATIONS: Record<string, SubcaseTemplates> = {
  [USER_NOTIFICATIONS_NAMES.REGISTRO_DE_USUARIO]: {
    EMAIL: {
      subject: '¡Bienvenido a Vyrtium Ecommerce, {name}!',
      template: welcomeEmailTemplate,
      data: {
        name: '{name}',
        email: '{email}',
        loginUrl: '{loginUrl}',
      },
    },
  },
};
