/**
 * Body scroll-lock helpers — Phase 27 (2026-06-03). Counter-based
 * + stack-aware so multiple modals/drawers open simultaneously only
 * restore the original `document.body.style.overflow` value when the
 * **last** one closes.
 *
 * Module-level mutable state:
 * - `lockCount` — current number of active locks (0 = no lock).
 * - `savedOverflow` — `document.body.style.overflow` value captured
 *   on the FIRST lock; restored to `body` on the LAST unlock.
 *
 * SSR safety: every helper guards `typeof document === 'undefined'`
 * at entry. Calling these on the server is a no-op.
 *
 * NOT exported via the public API surface:
 * `resetBodyScrollLockForTests` + `getBodyScrollLockCountForTests`.
 * Tests use those helpers to keep state from leaking across cases.
 */

let lockCount = 0;
let savedOverflow: string | null = null;

/**
 * Increment the lock counter. On the `0 → 1` transition, save the
 * current `document.body.style.overflow` (so we can restore it later)
 * and set it to `'hidden'`. Subsequent calls just increment the
 * counter — the overflow stays `'hidden'`.
 */
export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

/**
 * Decrement the lock counter. On the `1 → 0` transition, restore
 * `document.body.style.overflow` to the value captured at the first
 * lock. Going below zero is clamped to zero (defensive — a paired
 * `lockBodyScroll` should always precede each `unlockBodyScroll`).
 */
export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow ?? '';
    savedOverflow = null;
  }
}

/**
 * Test-only helper — read the current lock counter without mutating
 * it. Used by unit tests to assert stack-aware behavior.
 */
export function getBodyScrollLockCountForTests(): number {
  return lockCount;
}

/**
 * Test-only helper — reset counter + saved overflow so unit tests
 * don't depend on the order they run in. Adapters must NOT call this
 * in production code.
 */
export function resetBodyScrollLockForTests(): void {
  lockCount = 0;
  savedOverflow = null;
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
}
