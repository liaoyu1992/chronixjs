export const CHRONIX_BUTTON_GROUP_CSS = `
.cx-ui-button-group {
  display: inline-flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-button-group--horizontal {
  flex-direction: row;
}

.cx-ui-button-group--vertical {
  flex-direction: column;
}

.cx-ui-button-group--horizontal .cx-ui-button:not(:first-child) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
}

.cx-ui-button-group--horizontal .cx-ui-button:not(:last-child) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.cx-ui-button-group--vertical .cx-ui-button:not(:first-child) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: -1px;
}

.cx-ui-button-group--vertical .cx-ui-button:not(:last-child) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'button-group';

let injected = false;

export function ensureChronixButtonGroupStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_BUTTON_GROUP_CSS;
  document.head.appendChild(style);
  injected = true;
}
