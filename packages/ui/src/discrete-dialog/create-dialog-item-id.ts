/**
 * Generates a unique dialog item ID using a counter.
 * Counter-based (NOT Date.now / Math.random) for deterministic testing.
 */

let counter = 0;

export function createDialogItemId(): string {
  return `dlg-${counter++}`;
}
