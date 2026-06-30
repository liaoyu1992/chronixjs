import type { NotificationType } from './notification-spec.js';

/**
 * Input for `resolveNotificationClassList`.
 *
 * .
 */
export interface ResolveNotificationClassListInput {
  readonly type: NotificationType;
}

/**
 * Compute class set for a Notification root element.
 *
 * Class structure:
 *
 * - `'cx-ui-notification'` — always present.
 * - `'cx-ui-notification--{type}'` — drives icon + color variant.
 */
export function resolveNotificationClassList(input: ResolveNotificationClassListInput): string[] {
  return ['cx-ui-notification', `cx-ui-notification--${input.type}`];
}
