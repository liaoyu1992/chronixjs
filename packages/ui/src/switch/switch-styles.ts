export const CHRONIX_SWITCH_CSS = `
.cx-ui-switch {
  display: inline-flex;
  align-items: center;
  position: relative;
  border: 0;
  background: var(--cx-ui-switch-bg, #d1d5db);
  border-radius: 999px;
  padding: 2px;
  cursor: pointer;
  transition: background 160ms ease-in-out;
  outline: 0;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-switch--small {
  width: 28px;
  height: 16px;
}

.cx-ui-switch--medium {
  width: 36px;
  height: 20px;
}

.cx-ui-switch--large {
  width: 44px;
  height: 24px;
}

.cx-ui-switch__handle {
  display: block;
  background: var(--cx-ui-switch-handle-bg, #fff);
  border-radius: 50%;
  transition: transform 160ms ease-in-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.cx-ui-switch--small .cx-ui-switch__handle {
  width: 12px;
  height: 12px;
}

.cx-ui-switch--medium .cx-ui-switch__handle {
  width: 16px;
  height: 16px;
}

.cx-ui-switch--large .cx-ui-switch__handle {
  width: 20px;
  height: 20px;
}

.cx-ui-switch--checked {
  background: var(--cx-ui-switch-checked-bg, var(--cx-ui-primary-color, #2563eb));
}

.cx-ui-switch--checked.cx-ui-switch--small .cx-ui-switch__handle {
  transform: translateX(12px);
}

.cx-ui-switch--checked.cx-ui-switch--medium .cx-ui-switch__handle {
  transform: translateX(16px);
}

.cx-ui-switch--checked.cx-ui-switch--large .cx-ui-switch__handle {
  transform: translateX(20px);
}

.cx-ui-switch--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cx-ui-switch--invalid {
  outline: 2px solid var(--cx-ui-switch-invalid-border-color, #dc2626);
  outline-offset: 1px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'switch';

let injected = false;

export function ensureChronixSwitchStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_SWITCH_CSS;
  document.head.appendChild(style);
  injected = true;
}
