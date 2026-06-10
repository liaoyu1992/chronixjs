/**
 * Generates a unique notification item ID using a counter.
 * Counter-based (NOT Date.now / Math.random) for deterministic testing.
 */

let counter = 0;

export function createNotificationItemId(): string {
  return `notif-${counter++}`;
}
