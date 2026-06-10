export const CHRONIX_FLOAT_BUTTON_CSS = `
.cx-ui-float-button {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 48px;
  height: 48px;
  border: none;
  background: var(--cx-ui-float-button-bg, #ffffff);
  color: var(--cx-ui-float-button-color, #1f2937);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  font: inherit;
  padding: 6px;
}

.cx-ui-float-button--shape-circle {
  border-radius: 50%;
}

.cx-ui-float-button--shape-square {
  border-radius: 4px;
}

.cx-ui-float-button--type-primary {
  background: var(--cx-ui-float-button-primary-bg, #2563eb);
  color: var(--cx-ui-float-button-primary-color, #ffffff);
}

.cx-ui-float-button:hover {
  filter: brightness(0.95);
}

.cx-ui-float-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cx-ui-float-button__description {
  font-size: 10px;
  line-height: 1;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'float-button';

let injected = false;

export function ensureChronixFloatButtonStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_FLOAT_BUTTON_CSS;
  document.head.appendChild(style);
  injected = true;
}
