export const CHRONIX_POPCONFIRM_CSS = `
.cx-ui-popconfirm {
  position: fixed;
  background: var(--cx-ui-popconfirm-bg, #fff);
  color: var(--cx-ui-popconfirm-text-color, #1f2937);
  border: 1px solid var(--cx-ui-popconfirm-border-color, #e5e7eb);
  border-radius: var(--cx-ui-popconfirm-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-popconfirm-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 12px 14px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  max-width: 320px;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
}

.cx-ui-popconfirm--open {
  opacity: 1;
  pointer-events: auto;
}

.cx-ui-popconfirm__header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.cx-ui-popconfirm__icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--cx-ui-popconfirm-icon-color, #f59e0b);
}

.cx-ui-popconfirm__title {
  flex: 1;
  font-weight: 500;
}

.cx-ui-popconfirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cx-ui-popconfirm__action {
  cursor: pointer;
  border: 1px solid var(--cx-ui-popconfirm-border-color, #e5e7eb);
  background: var(--cx-ui-popconfirm-action-bg, #fff);
  color: inherit;
  padding: 4px 10px;
  border-radius: 3px;
  font: inherit;
  font-size: 13px;
}

.cx-ui-popconfirm__action--positive {
  background: var(--cx-ui-popconfirm-positive-bg, var(--cx-ui-primary-color, #2563eb));
  border-color: var(--cx-ui-popconfirm-positive-bg, var(--cx-ui-primary-color, #2563eb));
  color: var(--cx-ui-popconfirm-positive-text-color, #fff);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'popconfirm';

let injected = false;

export function ensureChronixPopconfirmStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_POPCONFIRM_CSS;
  document.head.appendChild(style);
  injected = true;
}
