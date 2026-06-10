export const CHRONIX_DROPDOWN_CSS = `
.cx-ui-dropdown {
  position: fixed;
  background: var(--cx-ui-dropdown-bg, #fff);
  color: var(--cx-ui-dropdown-text-color, #1f2937);
  border: 1px solid var(--cx-ui-dropdown-border-color, #e5e7eb);
  border-radius: var(--cx-ui-dropdown-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-dropdown-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.5;
  min-width: 120px;
  padding: 4px 0;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
  box-sizing: border-box;
}

.cx-ui-dropdown--open {
  opacity: 1;
  pointer-events: auto;
}

.cx-ui-dropdown__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.cx-ui-dropdown__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  user-select: none;
}

.cx-ui-dropdown__option--active {
  background: var(--cx-ui-dropdown-option-active-bg, rgba(0, 0, 0, 0.06));
}

.cx-ui-dropdown__option--disabled {
  color: var(--cx-ui-dropdown-option-disabled-color, #9ca3af);
  cursor: not-allowed;
}

.cx-ui-dropdown__option-icon {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
}

.cx-ui-dropdown__option-label {
  flex: 1;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'dropdown';

let injected = false;

export function ensureChronixDropdownStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_DROPDOWN_CSS;
  document.head.appendChild(style);
  injected = true;
}
