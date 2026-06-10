export const CHRONIX_INPUT_CSS = `
.cx-ui-input {
  display: inline-flex;
  align-items: center;
  position: relative;
  border: 1px solid var(--cx-ui-input-border-color, #d1d5db);
  border-radius: var(--cx-ui-input-border-radius, var(--cx-ui-border-radius, 3px));
  background: var(--cx-ui-input-bg, #fff);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  color: var(--cx-ui-input-text-color, #1f2937);
  transition: border-color 120ms ease-in-out;
}

.cx-ui-input--text {
  height: 32px;
  padding: 0 8px;
}

.cx-ui-input--textarea {
  display: inline-block;
  padding: 6px 8px;
  height: auto;
}

.cx-ui-input--small.cx-ui-input--text {
  height: 26px;
  font-size: 13px;
}

.cx-ui-input--medium.cx-ui-input--text {
  height: 32px;
  font-size: 14px;
}

.cx-ui-input--large.cx-ui-input--text {
  height: 38px;
  font-size: 16px;
}

.cx-ui-input--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--cx-ui-input-disabled-bg, #f3f4f6);
}

.cx-ui-input--invalid {
  border-color: var(--cx-ui-input-invalid-border-color, #dc2626);
}

.cx-ui-input__inner {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  padding: 0;
  width: 100%;
}

.cx-ui-input__inner::placeholder {
  color: var(--cx-ui-input-placeholder-color, #9ca3af);
}

.cx-ui-input--textarea > .cx-ui-input__inner {
  resize: vertical;
  line-height: 1.5;
}

.cx-ui-input__clear {
  cursor: pointer;
  border: 0;
  background: transparent;
  color: var(--cx-ui-input-clear-color, #6b7280);
  font: inherit;
  padding: 0 4px;
}

.cx-ui-input__error {
  display: block;
  margin-top: 4px;
  color: var(--cx-ui-input-invalid-text-color, #dc2626);
  font-size: 12px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'input';

let injected = false;

export function ensureChronixInputStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_INPUT_CSS;
  document.head.appendChild(style);
  injected = true;
}
