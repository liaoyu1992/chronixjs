export const CHRONIX_TOOLTIP_CSS = `
.cx-ui-tooltip {
  position: fixed;
  background: var(--cx-ui-tooltip-bg, #1f2937);
  color: var(--cx-ui-tooltip-text-color, #f9fafb);
  border-radius: var(--cx-ui-tooltip-border-radius, 4px);
  box-shadow: var(--cx-ui-tooltip-shadow, 0 4px 8px rgba(0, 0, 0, 0.18));
  padding: 4px 8px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 12px;
  line-height: 1.4;
  max-width: 240px;
  opacity: 0;
  transition: opacity 120ms ease-in-out;
  pointer-events: none;
}

.cx-ui-tooltip--open {
  opacity: 1;
  pointer-events: auto;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'tooltip';

let injected = false;

export function ensureChronixTooltipStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TOOLTIP_CSS;
  document.head.appendChild(style);
  injected = true;
}
