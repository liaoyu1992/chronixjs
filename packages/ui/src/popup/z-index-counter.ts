/**
 * Popup z-index counter — . Process-global
 * monotonic counter that mints stacking z-index values for opened
 * popups. Each call returns a new integer ≥ baseline, increasing.
 *
 * Multi-popup stacking emerges naturally — later-opened popups stack
 * above earlier ones. Stale (closed) popups do not release their slot;
 * the counter only grows. For the typical web UI use case (handful of
 * popups open at any time), monotonic growth is fine even across long
 * sessions (32-bit int won't overflow on realistic usage).
 *
 * The baseline `1000` keeps popups above typical app chrome
 * (`z-index: 0..999` is the conventional app range) without colliding
 * with reference UI library precedents (most use 2000-3000 ranges).
 *
 * NOT exported via the public API surface: `resetPopupZIndexForTests`.
 * Tests use that helper to keep the counter from leaking across cases.
 */
const BASELINE_Z_INDEX = 1000;

let counter = BASELINE_Z_INDEX;

export function nextPopupZIndex(): number {
  return counter++;
}

/**
 * Test-only helper — reset the counter so unit tests don't depend on
 * the order they run in. Adapters must NOT call this in production code.
 */
export function resetPopupZIndexForTests(): void {
  counter = BASELINE_Z_INDEX;
}
