export const CHRONIX_RADIO_CSS = `
.cx-ui-radio-group {
  display: inline-flex;
  flex-direction: row;
  gap: 16px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--cx-ui-radio-text-color, #1f2937);
  font-size: 14px;
  user-select: none;
}

.cx-ui-radio__circle {
  width: 14px;
  height: 14px;
  border: 1px solid var(--cx-ui-radio-border-color, #9ca3af);
  border-radius: 50%;
  position: relative;
  background: var(--cx-ui-radio-bg, #fff);
  box-sizing: border-box;
  transition: border-color 120ms ease-in-out;
}

.cx-ui-radio--checked .cx-ui-radio__circle {
  border-color: var(--cx-ui-radio-checked-border-color, var(--cx-ui-primary-color, #2563eb));
}

.cx-ui-radio--checked .cx-ui-radio__circle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cx-ui-radio-checked-dot-color, var(--cx-ui-primary-color, #2563eb));
  transform: translate(-50%, -50%);
}

.cx-ui-radio--disabled,
.cx-ui-radio-group--disabled .cx-ui-radio {
  opacity: 0.6;
  cursor: not-allowed;
}

.cx-ui-radio-group--invalid .cx-ui-radio__circle {
  border-color: var(--cx-ui-radio-invalid-border-color, #dc2626);
}

.cx-ui-radio__label {
  line-height: 1;
}

.cx-ui-radio-group__error {
  display: block;
  width: 100%;
  margin-top: 4px;
  color: var(--cx-ui-radio-invalid-text-color, #dc2626);
  font-size: 12px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'radio';

let injected = false;

export function ensureChronixRadioStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_RADIO_CSS;
  document.head.appendChild(style);
  injected = true;
}
