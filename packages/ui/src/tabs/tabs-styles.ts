export const CHRONIX_TABS_CSS = `
.cx-ui-tabs {
  display: flex;
  width: 100%;
  color: var(--cx-ui-tabs-color, #1f2937);
}

.cx-ui-tabs--placement-top {
  flex-direction: column;
}

.cx-ui-tabs--placement-bottom {
  flex-direction: column-reverse;
}

.cx-ui-tabs--placement-left {
  flex-direction: row;
}

.cx-ui-tabs--placement-right {
  flex-direction: row-reverse;
}

.cx-ui-tabs--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-tabs__bar {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.cx-ui-tabs--placement-left .cx-ui-tabs__bar,
.cx-ui-tabs--placement-right .cx-ui-tabs__bar {
  flex-direction: column;
}

.cx-ui-tabs__tab {
  background: transparent;
  border: 1px solid transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  outline: none;
  text-align: left;
  white-space: nowrap;
}

.cx-ui-tabs--size-small .cx-ui-tabs__tab {
  padding: 4px 12px;
  font-size: 12px;
}

.cx-ui-tabs--size-medium .cx-ui-tabs__tab {
  padding: 8px 16px;
  font-size: 14px;
}

.cx-ui-tabs--size-large .cx-ui-tabs__tab {
  padding: 12px 20px;
  font-size: 16px;
}

.cx-ui-tabs__tab--active {
  color: var(--cx-ui-tabs-active-color, #2563eb);
  font-weight: 600;
}

.cx-ui-tabs__tab--disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.cx-ui-tabs--type-line .cx-ui-tabs__tab--active {
  border-bottom: 2px solid var(--cx-ui-tabs-active-color, #2563eb);
}

.cx-ui-tabs--type-card .cx-ui-tabs__tab {
  border: 1px solid var(--cx-ui-tabs-card-border, #d1d5db);
  border-bottom: none;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  background: var(--cx-ui-tabs-card-bg, #f9fafb);
}

.cx-ui-tabs--type-card .cx-ui-tabs__tab--active {
  background: var(--cx-ui-tabs-card-active-bg, #ffffff);
  border-color: var(--cx-ui-tabs-card-border, #d1d5db);
}

.cx-ui-tabs--type-segment {
  display: inline-flex;
}

.cx-ui-tabs--type-segment .cx-ui-tabs__bar {
  background: var(--cx-ui-tabs-segment-bg, #e5e7eb);
  border-radius: 6px;
  padding: 2px;
  gap: 0;
}

.cx-ui-tabs--type-segment .cx-ui-tabs__tab {
  border-radius: 4px;
}

.cx-ui-tabs--type-segment .cx-ui-tabs__tab--active {
  background: var(--cx-ui-tabs-segment-active-bg, #ffffff);
  color: var(--cx-ui-tabs-active-color, #2563eb);
}

.cx-ui-tabs__tab--closable {
  padding-right: 6px;
}

.cx-ui-tabs__tab-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  border-radius: 2px;
}

.cx-ui-tabs__tab-close:hover {
  background: var(--cx-ui-tabs-close-hover-bg, rgba(0, 0, 0, 0.06));
}

.cx-ui-tabs__add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--cx-ui-tabs-add-border, #d1d5db);
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 4px 12px;
  border-radius: 4px;
}

.cx-ui-tabs__add-btn:hover {
  border-color: var(--cx-ui-tabs-active-color, #2563eb);
  color: var(--cx-ui-tabs-active-color, #2563eb);
}

.cx-ui-tabs__tab--drag-over {
  border-left: 2px solid var(--cx-ui-tabs-active-color, #2563eb);
}

.cx-ui-tabs__panel {
  flex: 1 1 auto;
  padding: 16px 0;
  min-width: 0;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'tabs';

let injected = false;

export function ensureChronixTabsStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TABS_CSS;
  document.head.appendChild(style);
  injected = true;
}
