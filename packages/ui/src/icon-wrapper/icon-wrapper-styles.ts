export const CHRONIX_ICON_WRAPPER_CSS = `
.cx-ui-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  flex-shrink: 0;
}

.cx-ui-icon-wrapper > * {
  width: 100%;
  height: 100%;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'icon-wrapper';

let injected = false;

export function ensureChronixIconWrapperStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_ICON_WRAPPER_CSS;
  document.head.appendChild(style);
  injected = true;
}
