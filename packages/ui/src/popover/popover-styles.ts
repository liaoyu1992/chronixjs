export const CHRONIX_POPOVER_CSS = `
.cx-ui-popover {
  position: fixed;
  background: var(--cx-ui-popover-bg, #fff);
  color: var(--cx-ui-popover-text-color, #1f2937);
  border: 1px solid var(--cx-ui-popover-border-color, #e5e7eb);
  border-radius: var(--cx-ui-popover-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-popover-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 8px 12px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.5;
  max-width: 320px;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
}

.cx-ui-popover--open {
  opacity: 1;
  pointer-events: auto;
}

.cx-ui-popover__trigger {
  display: inline-block;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'popover';

let injected = false;

export function ensureChronixPopoverStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_POPOVER_CSS;
  document.head.appendChild(style);
  injected = true;
}
