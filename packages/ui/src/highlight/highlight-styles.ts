export const CHRONIX_HIGHLIGHT_CSS = `
.cx-ui-highlight {
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  color: var(--cx-ui-highlight-text-color, inherit);
}

.cx-ui-highlight__match {
  background: var(--cx-ui-highlight-match-bg, #fef08a);
  color: var(--cx-ui-highlight-match-color, #1f2937);
  padding: 0 2px;
  border-radius: 2px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'highlight';

let injected = false;

export function ensureChronixHighlightStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_HIGHLIGHT_CSS;
  document.head.appendChild(style);
  injected = true;
}
