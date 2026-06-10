export const CHRONIX_ICON_CSS = `
.cx-ui-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  fill: currentColor;
  flex-shrink: 0;
}

.cx-ui-icon--missing {
  color: var(--cx-ui-icon-missing-color, #ef4444);
  font-weight: 600;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'icon';

let injected = false;

export function ensureChronixIconStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_ICON_CSS;
  document.head.appendChild(style);
  injected = true;
}
