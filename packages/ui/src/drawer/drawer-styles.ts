export const CHRONIX_DRAWER_CSS = `
.cx-ui-drawer-wrapper {
  position: fixed;
  inset: 0;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-drawer__mask {
  position: absolute;
  inset: 0;
  background: var(--cx-ui-drawer-mask-bg, rgba(0, 0, 0, 0.45));
}

.cx-ui-drawer {
  position: absolute;
  background: var(--cx-ui-drawer-bg, #fff);
  color: var(--cx-ui-drawer-text-color, #1f2937);
  box-shadow: var(--cx-ui-drawer-shadow, 0 8px 24px rgba(0, 0, 0, 0.18));
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  outline: none;
  max-width: 100vw;
  max-height: 100vh;
}

.cx-ui-drawer--placement-right { top: 0; right: 0; bottom: 0; }
.cx-ui-drawer--placement-left { top: 0; left: 0; bottom: 0; }
.cx-ui-drawer--placement-top { top: 0; left: 0; right: 0; }
.cx-ui-drawer--placement-bottom { bottom: 0; left: 0; right: 0; }

.cx-ui-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--cx-ui-drawer-border-color, #e5e7eb);
}

.cx-ui-drawer__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
}

.cx-ui-drawer__close {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 20px;
  line-height: 1;
  color: inherit;
  border-radius: 4px;
}

.cx-ui-drawer__close:hover {
  background: var(--cx-ui-drawer-close-hover-bg, rgba(0, 0, 0, 0.06));
}

.cx-ui-drawer__body {
  padding: 16px 20px;
  overflow: auto;
  flex: 1 1 auto;
  font-size: 14px;
  line-height: 1.5;
}

.cx-ui-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--cx-ui-drawer-border-color, #e5e7eb);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'drawer';

let injected = false;

export function ensureChronixDrawerStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_DRAWER_CSS;
  document.head.appendChild(style);
  injected = true;
}
