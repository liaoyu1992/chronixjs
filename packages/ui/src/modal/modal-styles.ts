export const CHRONIX_MODAL_CSS = `
.cx-ui-modal-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-modal__mask {
  position: absolute;
  inset: 0;
  background: var(--cx-ui-modal-mask-bg, rgba(0, 0, 0, 0.45));
}

.cx-ui-modal {
  position: relative;
  background: var(--cx-ui-modal-bg, #fff);
  color: var(--cx-ui-modal-text-color, #1f2937);
  border-radius: var(--cx-ui-modal-border-radius, var(--cx-ui-border-radius, 6px));
  box-shadow: var(--cx-ui-modal-shadow, 0 10px 32px rgba(0, 0, 0, 0.2));
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  outline: none;
}

.cx-ui-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--cx-ui-modal-border-color, #e5e7eb);
}

.cx-ui-modal__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.cx-ui-modal__close {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 20px;
  line-height: 1;
  color: inherit;
  border-radius: 4px;
}

.cx-ui-modal__close:hover {
  background: var(--cx-ui-modal-close-hover-bg, rgba(0, 0, 0, 0.06));
}

.cx-ui-modal__body {
  padding: 16px 20px;
  overflow: auto;
  flex: 1 1 auto;
  font-size: 14px;
  line-height: 1.5;
}

.cx-ui-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--cx-ui-modal-border-color, #e5e7eb);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'modal';

let injected = false;

export function ensureChronixModalStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_MODAL_CSS;
  document.head.appendChild(style);
  injected = true;
}
