/**
 * Generates a unique message item ID using a counter.
 * Counter-based (NOT Date.now / Math.random) for deterministic testing.
 */

let counter = 0;

export function createMessageItemId(): string {
  return `msg-${counter++}`;
}
