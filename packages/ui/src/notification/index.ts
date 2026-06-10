/**
 * chronix-ui notification module — Phase 36 (2026-06-05).
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
