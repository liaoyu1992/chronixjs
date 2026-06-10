export const CHRONIX_INPUT_NUMBER_CSS = `
.cx-ui-input-number {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid var(--cx-ui-input-number-border-color, #d1d5db);
  border-radius: var(--cx-ui-input-number-border-radius, var(--cx-ui-border-radius, 3px));
  background: var(--cx-ui-input-number-bg, #fff);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  color: var(--cx-ui-input-number-text-color, #1f2937);
  overflow: hidden;
}

.cx-ui-input-number--small {
  height: 26px;
  font-size: 13px;
}

.cx-ui-input-number--medium {
  height: 32px;
  font-size: 14px;
}

.cx-ui-input-number--large {
  height: 38px;
  font-size: 16px;
}

.cx-ui-input-number__input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: center;
  width: 64px;
  min-width: 0;
}

.cx-ui-input-number__decrement,
.cx-ui-input-number__increment {
  border: 0;
  background: var(--cx-ui-input-number-stepper-bg, #f9fafb);
  cursor: pointer;
  font: inherit;
  color: inherit;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cx-ui-input-number__decrement {
  border-right: 1px solid var(--cx-ui-input-number-border-color, #d1d5db);
}

.cx-ui-input-number__increment {
  border-left: 1px solid var(--cx-ui-input-number-border-color, #d1d5db);
}

.cx-ui-input-number__decrement:hover,
.cx-ui-input-number__increment:hover {
  background: var(--cx-ui-input-number-stepper-hover-bg, #f3f4f6);
}

.cx-ui-input-number--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--cx-ui-input-number-disabled-bg, #f3f4f6);
}

.cx-ui-input-number--disabled .cx-ui-input-number__decrement,
.cx-ui-input-number--disabled .cx-ui-input-number__increment,
.cx-ui-input-number--disabled .cx-ui-input-number__input {
  cursor: not-allowed;
}

.cx-ui-input-number--invalid {
  border-color: var(--cx-ui-input-number-invalid-border-color, #dc2626);
}

.cx-ui-input-number__error {
  display: block;
  margin-top: 4px;
  color: var(--cx-ui-input-number-invalid-text-color, #dc2626);
  font-size: 12px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'input-number';

let injected = false;

export function ensureChronixInputNumberStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_INPUT_NUMBER_CSS;
  document.head.appendChild(style);
  injected = true;
}
