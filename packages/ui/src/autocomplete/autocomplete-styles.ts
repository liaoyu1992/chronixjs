export const CHRONIX_AUTOCOMPLETE_CSS = `
.cx-ui-autocomplete {
  position: relative;
  display: inline-block;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-autocomplete__input {
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--cx-ui-autocomplete-border-color, #d1d5db);
  border-radius: var(--cx-ui-autocomplete-border-radius, var(--cx-ui-border-radius, 3px));
  background: var(--cx-ui-autocomplete-bg, #fff);
  font: inherit;
  color: var(--cx-ui-autocomplete-text-color, #1f2937);
  outline: 0;
  width: 100%;
  box-sizing: border-box;
}

.cx-ui-autocomplete--small .cx-ui-autocomplete__input {
  height: 26px;
  font-size: 13px;
}

.cx-ui-autocomplete--medium .cx-ui-autocomplete__input {
  height: 32px;
  font-size: 14px;
}

.cx-ui-autocomplete--large .cx-ui-autocomplete__input {
  height: 38px;
  font-size: 16px;
}

.cx-ui-autocomplete--disabled .cx-ui-autocomplete__input {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--cx-ui-autocomplete-disabled-bg, #f3f4f6);
}

.cx-ui-autocomplete--invalid .cx-ui-autocomplete__input {
  border-color: var(--cx-ui-autocomplete-invalid-border-color, #dc2626);
}

.cx-ui-autocomplete__list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 4px 0 0 0;
  padding: 4px 0;
  list-style: none;
  background: var(--cx-ui-autocomplete-list-bg, #fff);
  border: 1px solid var(--cx-ui-autocomplete-list-border-color, #e5e7eb);
  border-radius: var(--cx-ui-autocomplete-border-radius, var(--cx-ui-border-radius, 3px));
  box-shadow: var(--cx-ui-autocomplete-list-shadow, 0 4px 12px rgba(0, 0, 0, 0.1));
  z-index: var(--cx-ui-autocomplete-list-z-index, 1000);
  max-height: 240px;
  overflow-y: auto;
}

.cx-ui-autocomplete__option {
  padding: 6px 10px;
  cursor: pointer;
  color: var(--cx-ui-autocomplete-option-color, #1f2937);
}

.cx-ui-autocomplete__option:hover,
.cx-ui-autocomplete__option--active {
  background: var(--cx-ui-autocomplete-option-active-bg, #f3f4f6);
}

.cx-ui-autocomplete__error {
  display: block;
  margin-top: 4px;
  color: var(--cx-ui-autocomplete-invalid-text-color, #dc2626);
  font-size: 12px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'autocomplete';

let injected = false;

export function ensureChronixAutoCompleteStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_AUTOCOMPLETE_CSS;
  document.head.appendChild(style);
  injected = true;
}
