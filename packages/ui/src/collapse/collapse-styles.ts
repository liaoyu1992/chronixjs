export const CHRONIX_COLLAPSE_CSS = `
.cx-ui-collapse {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--cx-ui-collapse-border, #d1d5db);
  border-radius: 4px;
  overflow: hidden;
  color: var(--cx-ui-collapse-color, #1f2937);
  background: var(--cx-ui-collapse-bg, #ffffff);
}

.cx-ui-collapse__item {
  border-bottom: 1px solid var(--cx-ui-collapse-border, #d1d5db);
}

.cx-ui-collapse__item:last-child {
  border-bottom: none;
}

.cx-ui-collapse__item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cx-ui-collapse__header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  gap: 8px;
}

.cx-ui-collapse__item--disabled .cx-ui-collapse__header {
  cursor: not-allowed;
}

.cx-ui-collapse__header:hover:not([disabled]) {
  background: var(--cx-ui-collapse-header-hover, #f3f4f6);
}

.cx-ui-collapse__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cx-ui-collapse__item--expanded .cx-ui-collapse__arrow {
  transform: rotate(90deg);
}

.cx-ui-collapse--arrow-right .cx-ui-collapse__header {
  flex-direction: row-reverse;
}

.cx-ui-collapse__title {
  flex: 1 1 auto;
}

.cx-ui-collapse__body {
  overflow: hidden;
}

.cx-ui-collapse__content {
  padding: 12px 16px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'collapse';

let injected = false;

export function ensureChronixCollapseStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_COLLAPSE_CSS;
  document.head.appendChild(style);
  injected = true;
}
