export const CHRONIX_LAYOUT_CSS = `
.cx-ui-layout {
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.cx-ui-layout--has-sider {
  flex-direction: row;
}

.cx-ui-layout--position-absolute {
  position: absolute;
  inset: 0;
}

.cx-ui-layout__header {
  flex: 0 0 auto;
  padding: 0 24px;
  height: 64px;
  line-height: 64px;
  background-color: var(--cx-ui-layout-header-bg, #1f2937);
  color: var(--cx-ui-layout-header-color, #f9fafb);
  display: flex;
  align-items: center;
}

.cx-ui-layout__content {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  padding: 16px;
  background-color: var(--cx-ui-layout-content-bg, #ffffff);
  color: var(--cx-ui-layout-content-color, #1f2937);
}

.cx-ui-layout__sider {
  flex: 0 0 auto;
  background-color: var(--cx-ui-layout-sider-bg, #111827);
  color: var(--cx-ui-layout-sider-color, #f3f4f6);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cx-ui-layout__sider--placement-left {
  order: -1;
}

.cx-ui-layout__sider--placement-right {
  order: 1;
}

.cx-ui-layout__sider-content {
  flex: 1 1 auto;
  overflow: auto;
}

.cx-ui-layout__sider-trigger {
  flex: 0 0 auto;
  height: 48px;
  border: none;
  background-color: var(--cx-ui-layout-sider-trigger-bg, rgba(255, 255, 255, 0.05));
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cx-ui-layout__sider-trigger:hover {
  background-color: var(--cx-ui-layout-sider-trigger-hover-bg, rgba(255, 255, 255, 0.1));
}

.cx-ui-layout__footer {
  flex: 0 0 auto;
  padding: 16px 24px;
  background-color: var(--cx-ui-layout-footer-bg, #f3f4f6);
  color: var(--cx-ui-layout-footer-color, #374151);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'layout';

let injected = false;

export function ensureChronixLayoutStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_LAYOUT_CSS;
  document.head.appendChild(style);
  injected = true;
}
