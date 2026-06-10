/**
 * Spin stylesheet — Phase 16 (2026-06-02).
 *
 * CSS-only indicator: a circle border with `border-top-color:
 * transparent` rotated via keyframes. Decouples Spin from the Phase 9
 * icon registry (no SVG dependency) — every adapter ships the same
 * spinner shape with no extra bundle cost.
 *
 * Two-level fallback (`var(--cx-ui-spin-*, fallback)`) keeps the
 * indicator visible when no `<ChronixUIProvider>` is mounted.
 */
export const CHRONIX_SPIN_CSS = `
.cx-ui-spin {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--cx-ui-spin-text-color, #6b7280);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-spin-font-size, 14px);
  line-height: 1;
}

.cx-ui-spin__indicator {
  box-sizing: border-box;
  width: var(--cx-ui-spin-size, 22px);
  height: var(--cx-ui-spin-size, 22px);
  border: 2px solid var(--cx-ui-spin-track-color, #e5e7eb);
  border-top-color: var(--cx-ui-spin-color, #18a058);
  border-radius: 50%;
  animation: cx-ui-spin-rotate 0.9s linear infinite;
}

.cx-ui-spin--small .cx-ui-spin__indicator {
  width: var(--cx-ui-spin-size-small, 14px);
  height: var(--cx-ui-spin-size-small, 14px);
  border-width: 1.5px;
}

.cx-ui-spin--medium .cx-ui-spin__indicator {
  width: var(--cx-ui-spin-size, 22px);
  height: var(--cx-ui-spin-size, 22px);
  border-width: 2px;
}

.cx-ui-spin--large .cx-ui-spin__indicator {
  width: var(--cx-ui-spin-size-large, 30px);
  height: var(--cx-ui-spin-size-large, 30px);
  border-width: 3px;
}

.cx-ui-spin__description {
  text-align: center;
  font-weight: var(--cx-ui-spin-description-font-weight, 400);
}

.cx-ui-spin--hidden {
  display: none;
}

@keyframes cx-ui-spin-rotate {
  to { transform: rotate(360deg); }
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'spin';

let injected = false;

/**
 * Inject the Spin stylesheet into `document.head` exactly once.
 * Safe to call from any adapter; no-op on server + subsequent calls.
 * Sticky-flag semantics: once injected, removing the `<style>` element
 * does NOT trigger re-injection (matches Phase 12 button-styles).
 */
export function ensureChronixSpinStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_SPIN_CSS;
  document.head.appendChild(style);
  injected = true;
}
