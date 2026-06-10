export const CHRONIX_DYNAMIC_INPUT_CSS = `
.cx-ui-dynamic-input {
  display: flex;
  flex-direction: column;
  gap: var(--cx-ui-dynamic-input-gap, 8px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-dynamic-input--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cx-ui-dynamic-input__item-row {
  display: flex;
  align-items: center;
  gap: var(--cx-ui-dynamic-input-item-gap, 6px);
}

.cx-ui-dynamic-input__item-input {
  flex: 1;
  border: 1px solid var(--cx-ui-dynamic-input-border-color, #d1d5db);
  border-radius: var(--cx-ui-dynamic-input-border-radius, var(--cx-ui-border-radius, 3px));
  padding: 0 8px;
  height: 32px;
  font: inherit;
  color: var(--cx-ui-dynamic-input-text-color, #1f2937);
  background: var(--cx-ui-dynamic-input-bg, #fff);
}

.cx-ui-dynamic-input__item-input::placeholder {
  color: var(--cx-ui-dynamic-input-placeholder-color, #9ca3af);
}

.cx-ui-dynamic-input__remove-btn,
.cx-ui-dynamic-input__add-btn {
  border: 1px solid var(--cx-ui-dynamic-input-btn-border-color, #d1d5db);
  border-radius: var(--cx-ui-dynamic-input-border-radius, var(--cx-ui-border-radius, 3px));
  background: var(--cx-ui-dynamic-input-btn-bg, #fff);
  color: var(--cx-ui-dynamic-input-btn-text-color, #374151);
  cursor: pointer;
  padding: 4px 10px;
  font: inherit;
  line-height: 1;
  transition: border-color 120ms ease-in-out;
}

.cx-ui-dynamic-input__remove-btn:hover,
.cx-ui-dynamic-input__add-btn:hover {
  border-color: var(--cx-ui-dynamic-input-btn-hover-border-color, #6b7280);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'dynamic-input';

let injected = false;

export function ensureChronixDynamicInputStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_DYNAMIC_INPUT_CSS;
  document.head.appendChild(style);
  injected = true;
}
