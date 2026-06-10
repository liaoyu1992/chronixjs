export const CHRONIX_COLLAPSE_TRANSITION_CSS = `
.cx-ui-collapse-transition {
  overflow: hidden;
}

.cx-ui-collapse-transition--expanded {
  /* Adapter sets height inline; no overrides needed here. */
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'collapse-transition';

let injected = false;

export function ensureChronixCollapseTransitionStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_COLLAPSE_TRANSITION_CSS;
  document.head.appendChild(style);
  injected = true;
}
