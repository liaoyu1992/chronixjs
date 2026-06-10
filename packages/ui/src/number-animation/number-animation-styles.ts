export const CHRONIX_NUMBER_ANIMATION_CSS = `
.cx-ui-number-animation {
  display: inline-block;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-variant-numeric: tabular-nums;
  color: var(--cx-ui-number-animation-text-color, #1f2937);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'number-animation';

let injected = false;

export function ensureChronixNumberAnimationStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_NUMBER_ANIMATION_CSS;
  document.head.appendChild(style);
  injected = true;
}
