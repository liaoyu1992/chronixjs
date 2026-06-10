export const CHRONIX_POP_SELECT_CSS = `
.cx-ui-pop-select {
  position: fixed;
  background: var(--cx-ui-pop-select-bg, #fff);
  color: var(--cx-ui-pop-select-text-color, #1f2937);
  border: 1px solid var(--cx-ui-pop-select-border-color, #e5e7eb);
  border-radius: var(--cx-ui-pop-select-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-pop-select-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 4px 0;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  min-width: 120px;
  max-height: 280px;
  overflow-y: auto;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
}

.cx-ui-pop-select--open {
  opacity: 1;
  pointer-events: auto;
}

.cx-ui-pop-select__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.cx-ui-pop-select__option {
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cx-ui-pop-select__option:hover {
  background: var(--cx-ui-pop-select-option-hover-bg, #f3f4f6);
}

.cx-ui-pop-select__option--active {
  background: var(--cx-ui-pop-select-option-active-bg, var(--cx-ui-primary-color, #2563eb));
  color: var(--cx-ui-pop-select-option-active-text-color, #fff);
}

.cx-ui-pop-select__option--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'pop-select';

let injected = false;

export function ensureChronixPopSelectStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_POP_SELECT_CSS;
  document.head.appendChild(style);
  injected = true;
}
