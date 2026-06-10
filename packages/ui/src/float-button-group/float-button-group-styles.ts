export const CHRONIX_FLOAT_BUTTON_GROUP_CSS = `
.cx-ui-float-button-group {
  display: inline-flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 8px;
}

.cx-ui-float-button-group__children {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 8px;
}

.cx-ui-float-button-group--trigger-click .cx-ui-float-button-group__children,
.cx-ui-float-button-group--trigger-hover .cx-ui-float-button-group__children {
  display: none;
}

.cx-ui-float-button-group--expanded .cx-ui-float-button-group__children {
  display: flex;
}

.cx-ui-float-button-group__trigger {
  /* Main button styled by the inner FloatButton; group adds no extra. */
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'float-button-group';

let injected = false;

export function ensureChronixFloatButtonGroupStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_FLOAT_BUTTON_GROUP_CSS;
  document.head.appendChild(style);
  injected = true;
}
