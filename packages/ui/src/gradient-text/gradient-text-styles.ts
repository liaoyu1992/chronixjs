export const CHRONIX_GRADIENT_TEXT_CSS = `
.cx-ui-gradient-text {
  display: inline-block;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-weight: var(--cx-ui-gradient-text-font-weight, 600);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'gradient-text';

let injected = false;

export function ensureChronixGradientTextStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_GRADIENT_TEXT_CSS;
  document.head.appendChild(style);
  injected = true;
}
