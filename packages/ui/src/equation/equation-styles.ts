export const CHRONIX_EQUATION_CSS = `
.cx-ui-equation {
  font-family: var(--cx-ui-equation-font-family, 'STIXTwoText', 'STIX Two Math', 'Cambria Math', serif);
  color: var(--cx-ui-equation-text-color, inherit);
}

.cx-ui-equation--inline {
  display: inline;
}

.cx-ui-equation--block {
  display: block;
  margin: 8px 0;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'equation';

let injected = false;

export function ensureChronixEquationStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_EQUATION_CSS;
  document.head.appendChild(style);
  injected = true;
}
