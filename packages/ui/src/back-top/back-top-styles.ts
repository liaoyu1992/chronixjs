export const CHRONIX_BACK_TOP_CSS = `
.cx-ui-back-top {
  position: fixed;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: var(--cx-ui-back-top-border-radius, 999px);
  background: var(--cx-ui-back-top-bg, #fff);
  color: var(--cx-ui-back-top-color, #1f2937);
  box-shadow: var(--cx-ui-back-top-shadow, 0 4px 12px rgba(0, 0, 0, 0.16));
  cursor: pointer;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 16px;
  padding: 0;
  z-index: var(--cx-ui-back-top-z-index, 10);
}

.cx-ui-back-top:hover {
  background: var(--cx-ui-back-top-hover-bg, #f4f5f7);
}

.cx-ui-back-top__icon {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'back-top';

let injected = false;

export function ensureChronixBackTopStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_BACK_TOP_CSS;
  document.head.appendChild(style);
  injected = true;
}
