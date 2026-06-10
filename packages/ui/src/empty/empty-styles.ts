/**
 * Empty stylesheet — Phase 15 (2026-06-02).
 */
export const CHRONIX_EMPTY_CSS = `
.cx-ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--cx-ui-empty-text-color, #6b7280);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-empty-font-size, 14px);
}

/* Size modifiers — drive icon + spacing tokens */
.cx-ui-empty--small .cx-ui-empty__icon { font-size: 32px; }
.cx-ui-empty--medium .cx-ui-empty__icon { font-size: 48px; }
.cx-ui-empty--large .cx-ui-empty__icon { font-size: 64px; }

.cx-ui-empty--small { padding: 12px; gap: 8px; }
.cx-ui-empty--medium { padding: 24px; gap: 12px; }
.cx-ui-empty--large { padding: 32px; gap: 16px; }

/* Icon area — Phase 15 ships a Unicode placeholder; Phase 9 icon
   registry will swap in an SVG once that lands. */
.cx-ui-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  line-height: 1;
}

.cx-ui-empty__description {
  font-weight: var(--cx-ui-empty-description-font-weight, 400);
}

.cx-ui-empty__extra {
  margin-top: 8px;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'empty';

let injected = false;

export function ensureChronixEmptyStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_EMPTY_CSS;
  document.head.appendChild(style);
  injected = true;
}
