export const CHRONIX_TYPOGRAPHY_CSS = `
.cx-ui-typography {
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  color: var(--cx-ui-typography-text-color, #1f2937);
}

.cx-ui-typography--text {
  display: inline;
}

.cx-ui-typography--title {
  font-weight: var(--cx-ui-typography-title-font-weight, 600);
  margin: 0;
  line-height: 1.3;
}

.cx-ui-typography--level-1 {
  font-size: var(--cx-ui-typography-title-1-font-size, 28px);
}

.cx-ui-typography--level-2 {
  font-size: var(--cx-ui-typography-title-2-font-size, 24px);
}

.cx-ui-typography--level-3 {
  font-size: var(--cx-ui-typography-title-3-font-size, 20px);
}

.cx-ui-typography--level-4 {
  font-size: var(--cx-ui-typography-title-4-font-size, 18px);
}

.cx-ui-typography--level-5 {
  font-size: var(--cx-ui-typography-title-5-font-size, 16px);
}

.cx-ui-typography--level-6 {
  font-size: var(--cx-ui-typography-title-6-font-size, 14px);
}

.cx-ui-typography--p {
  margin: 0 0 8px 0;
  line-height: 1.6;
}

.cx-ui-typography--blockquote {
  margin: 0 0 8px 0;
  padding-left: 12px;
  border-left: 3px solid var(--cx-ui-typography-blockquote-border-color, #d1d5db);
  color: var(--cx-ui-typography-blockquote-color, #6b7280);
  font-style: italic;
}

.cx-ui-typography--hr {
  border: 0;
  border-top: 1px solid var(--cx-ui-typography-hr-color, #e5e7eb);
  margin: 12px 0;
}

.cx-ui-typography--italic {
  font-style: italic;
}

.cx-ui-typography--underline {
  text-decoration: underline;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'typography';

let injected = false;

export function ensureChronixTypographyStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TYPOGRAPHY_CSS;
  document.head.appendChild(style);
  injected = true;
}
