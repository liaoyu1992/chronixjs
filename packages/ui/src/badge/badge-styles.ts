/**
 * Badge stylesheet — . Mirrors the
 * Button + Tag/Divider injection pattern.
 *
 * Layout strategy:
 *
 * - **Wrapped mode** (root has a child): the root is `position:
 *   relative; display: inline-block` and the `__sup` indicator is
 *   absolutely positioned at the top-right corner with `transform`
 *   to center it on the child's corner.
 * - **Standalone mode** (`--standalone` root modifier): the root
 *   suppresses positioning + the `__sup` renders inline (default
 *   `position: static`). Useful when the badge isn't decorating
 *   another element.
 *
 * Two-level fallback (`var(--cx-ui-badge-..., fallback)`) keeps
 * badges readable without a provider.
 */
export const CHRONIX_BADGE_CSS = `
.cx-ui-badge {
  position: relative;
  display: inline-flex;
  line-height: 1;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

/* Standalone — no child to anchor against, render the sup inline */
.cx-ui-badge--standalone {
  display: inline-flex;
  align-items: center;
}

.cx-ui-badge__sup {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: var(--cx-ui-badge-min-width, 18px);
  height: var(--cx-ui-badge-height, 18px);
  padding: 0 var(--cx-ui-badge-padding-x, 6px);
  border-radius: 999px;
  font-size: var(--cx-ui-badge-font-size, 12px);
  font-weight: var(--cx-ui-badge-font-weight, 400);
  line-height: 1;
  color: var(--cx-ui-badge-text-color, #ffffff);
  background-color: var(--cx-ui-badge-bg-color, #d03050);
  border: 1px solid transparent;
  white-space: nowrap;
}

/* When the badge wraps a child, anchor the sup at the top-right */
.cx-ui-badge:not(.cx-ui-badge--standalone) > .cx-ui-badge__sup {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  transform-origin: 100% 0;
  z-index: 1;
}

/* Type modifiers — drive bg colors. The text color is inherited from
   the base white above; type variants flip the bg only. */
.cx-ui-badge__sup--default {
  background-color: var(--cx-ui-badge-bg-color, #d03050);
}
.cx-ui-badge__sup--success {
  background-color: var(--cx-ui-badge-bg-color-success, #18a058);
}
.cx-ui-badge__sup--warning {
  background-color: var(--cx-ui-badge-bg-color-warning, #f0a020);
}
.cx-ui-badge__sup--error {
  background-color: var(--cx-ui-badge-bg-color-error, #d03050);
}
.cx-ui-badge__sup--info {
  background-color: var(--cx-ui-badge-bg-color-info, #2080f0);
}

/* Dot modifier — shrink to a 10px circle with no text */
.cx-ui-badge__sup--dot {
  min-width: var(--cx-ui-badge-dot-size, 10px);
  width: var(--cx-ui-badge-dot-size, 10px);
  height: var(--cx-ui-badge-dot-size, 10px);
  padding: 0;
  font-size: 0;
  line-height: 0;
}

/* Processing modifier — pulse animation. The animation is a
   keyframes-driven ring that expands + fades out behind the sup. */
.cx-ui-badge__sup--processing {
  position: relative;
}
.cx-ui-badge__sup--processing::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background-color: inherit;
  opacity: 0.4;
  animation: cx-ui-badge-pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  pointer-events: none;
}
@keyframes cx-ui-badge-pulse {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.6); opacity: 0; }
}

/* Hidden — used when show=false */
.cx-ui-badge__sup--hidden {
  display: none;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'badge';

let injected = false;

/**
 * Inject the Badge stylesheet into `document.head` exactly once.
 * Safe to call from any adapter; no-op on server + subsequent calls.
 */
export function ensureChronixBadgeStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_BADGE_CSS;
  document.head.appendChild(style);
  injected = true;
}
