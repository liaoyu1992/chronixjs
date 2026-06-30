/**
 * chronix-ui notification module — .
 */

export type {
  NotificationItem,
  NotificationPlacement,
  NotificationType,
} from './notification-spec.js';
export { createNotificationItemId } from './create-notification-item-id.js';
export type { ResolveNotificationClassListInput } from './resolve-notification-class-list.js';
export { resolveNotificationClassList } from './resolve-notification-class-list.js';
export {
  CHRONIX_NOTIFICATION_CSS,
  ensureChronixNotificationStyles,
} from './notification-styles.js';
