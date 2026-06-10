export const CHRONIX_FOCUS_DETECTOR_CSS = `
.cx-ui-focus-detector {
  display: contents;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'focus-detector';

let injected = false;

export function ensureChronixFocusDetectorStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_FOCUS_DETECTOR_CSS;
  document.head.appendChild(style);
  injected = true;
}
