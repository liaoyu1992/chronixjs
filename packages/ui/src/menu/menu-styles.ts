export const CHRONIX_MENU_CSS = `
.cx-ui-menu {
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.5;
  color: var(--cx-ui-menu-text-color, #1f2937);
  background: var(--cx-ui-menu-bg, transparent);
}

.cx-ui-menu--mode-vertical {
  display: flex;
  flex-direction: column;
  width: 200px;
}

.cx-ui-menu--mode-horizontal {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.cx-ui-menu--collapsed {
  width: 48px;
}

.cx-ui-menu--collapsed .cx-ui-menu__item-label {
  display: none;
}

.cx-ui-menu__item {
  cursor: pointer;
  user-select: none;
}

.cx-ui-menu__item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
}

.cx-ui-menu__item-row:hover {
  background: var(--cx-ui-menu-item-hover-bg, rgba(0, 0, 0, 0.04));
}

.cx-ui-menu__item--active > .cx-ui-menu__item-row {
  background: var(--cx-ui-menu-item-active-bg, rgba(24, 144, 255, 0.12));
  color: var(--cx-ui-menu-item-active-color, #1677ff);
}

.cx-ui-menu__item--disabled > .cx-ui-menu__item-row {
  color: var(--cx-ui-menu-item-disabled-color, #9ca3af);
  cursor: not-allowed;
}

.cx-ui-menu__item--disabled > .cx-ui-menu__item-row:hover {
  background: transparent;
}

.cx-ui-menu__item-icon {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
}

.cx-ui-menu__item-label {
  flex: 1;
}

.cx-ui-menu__item-arrow {
  display: inline-flex;
  align-items: center;
  width: 16px;
  height: 16px;
  transition: transform 150ms ease-in-out;
}

.cx-ui-menu__item--expanded > .cx-ui-menu__item-row .cx-ui-menu__item-arrow {
  transform: rotate(90deg);
}

.cx-ui-menu__submenu {
  list-style: none;
  margin: 0;
  padding: 0 0 0 16px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'menu';

let injected = false;

export function ensureChronixMenuStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_MENU_CSS;
  document.head.appendChild(style);
  injected = true;
}
