export const CHRONIX_AFFIX_CSS = `
.cx-ui-affix {
  display: block;
}

.cx-ui-affix--affixed {
  z-index: var(--cx-ui-affix-z-index, 10);
}

.cx-ui-affix-placeholder {
  visibility: hidden;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'affix';

let injected = false;

export function ensureChronixAffixStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_AFFIX_CSS;
  document.head.appendChild(style);
  injected = true;
}
