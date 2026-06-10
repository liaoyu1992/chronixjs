export const CHRONIX_ELEMENT_CSS = `
.cx-ui-element {
  color: var(--cx-ui-element-text-color, inherit);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-element--inline {
  display: inline;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'element';

let injected = false;

export function ensureChronixElementStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_ELEMENT_CSS;
  document.head.appendChild(style);
  injected = true;
}
