export const CHRONIX_CODE_CSS = `
.cx-ui-code {
  font-family: var(--cx-ui-code-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: var(--cx-ui-code-font-size, 13px);
  color: var(--cx-ui-code-text-color, #1f2937);
  background: var(--cx-ui-code-bg, #f3f4f6);
  border-radius: var(--cx-ui-code-border-radius, 4px);
}

.cx-ui-code--block {
  display: block;
  padding: var(--cx-ui-code-block-padding, 12px 16px);
  margin: 0;
  white-space: pre;
  overflow-x: auto;
}

.cx-ui-code--inline {
  display: inline;
  padding: var(--cx-ui-code-inline-padding, 1px 6px);
  white-space: pre-wrap;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'code';

let injected = false;

export function ensureChronixCodeStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_CODE_CSS;
  document.head.appendChild(style);
  injected = true;
}
