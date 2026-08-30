import { NOTIFICATION_TEMPLATES_NAMES } from '../notification.constants';
import { NotificationCatalog } from '../interfaces/template.interface';
import { USER_NOTIFICATIONS } from '../user/user.template';

export const NOTIFICATION_TEMPLATES: NotificationCatalog = {
  [NOTIFICATION_TEMPLATES_NAMES.USER_NOTIFICATIONS]: USER_NOTIFICATIONS,
};
