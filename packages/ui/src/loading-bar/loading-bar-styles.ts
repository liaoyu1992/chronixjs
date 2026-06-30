/**
 * LoadingBar stylesheet — . Same pattern as
 * Alert/Button/Tag: single core CSS string, idempotent injection,
 * CSS-var token fallback.
 */
export const CHRONIX_LOADING_BAR_CSS = `
/* Container */
.cx-ui-loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: var(--cx-ui-loading-bar-height, 3px);
  background-color: var(--cx-ui-loading-bar-color, #2080f0);
  z-index: var(--cx-ui-loading-bar-z-index, 8000);
  transition: width 0.3s ease, background-color 0.3s ease;
  pointer-events: none;
}

/* Loading state — animate to ~70% width */
.cx-ui-loading-bar--loading {
  width: var(--cx-ui-loading-bar-loading-width, 70%);
  transition: width 4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* Finishing state — snap to 100% */
.cx-ui-loading-bar--finishing {
  width: 100%;
  transition: width 0.3s ease;
}

/* Error state — stay at current width, turn red */
.cx-ui-loading-bar--error {
  background-color: var(--cx-ui-loading-bar-error-color, #d03050);
  width: 100%;
  transition: background-color 0.3s ease, width 0.3s ease;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'loading-bar';

let injected = false;

export function ensureChronixLoadingBarStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_LOADING_BAR_CSS;
  document.head.appendChild(style);
  injected = true;
}
