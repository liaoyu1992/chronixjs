export const CHRONIX_CHECKBOX_CSS = `
.cx-ui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  color: var(--cx-ui-checkbox-text-color, #1f2937);
  cursor: pointer;
  user-select: none;
}

.cx-ui-checkbox__box {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--cx-ui-checkbox-border-color, #9ca3af);
  border-radius: var(--cx-ui-checkbox-border-radius, 3px);
  background: var(--cx-ui-checkbox-bg, #fff);
  box-sizing: border-box;
  transition: background 120ms ease-in-out, border-color 120ms ease-in-out;
}

.cx-ui-checkbox--checked .cx-ui-checkbox__box,
.cx-ui-checkbox--indeterminate .cx-ui-checkbox__box {
  background: var(--cx-ui-checkbox-checked-bg, var(--cx-ui-primary-color, #2563eb));
  border-color: var(--cx-ui-checkbox-checked-border-color, var(--cx-ui-primary-color, #2563eb));
}

.cx-ui-checkbox__icon {
  color: #fff;
  width: 12px;
  height: 12px;
}

.cx-ui-checkbox--indeterminate .cx-ui-checkbox__icon {
  width: 8px;
  height: 2px;
  background: #fff;
  border-radius: 1px;
}

.cx-ui-checkbox--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cx-ui-checkbox--invalid .cx-ui-checkbox__box {
  border-color: var(--cx-ui-checkbox-invalid-border-color, #dc2626);
}

.cx-ui-checkbox__label {
  line-height: 1;
}

.cx-ui-checkbox__error {
  display: block;
  margin-left: 22px;
  margin-top: 2px;
  color: var(--cx-ui-checkbox-invalid-text-color, #dc2626);
  font-size: 12px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'checkbox';

let injected = false;

export function ensureChronixCheckboxStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_CHECKBOX_CSS;
  document.head.appendChild(style);
  injected = true;
}
