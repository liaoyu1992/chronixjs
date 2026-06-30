/**
 * Card stylesheet — .
 */
export const CHRONIX_CARD_CSS = `
.cx-ui-card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background-color: var(--cx-ui-card-bg-color, #ffffff);
  color: var(--cx-ui-card-text-color, #1f2937);
  border: 1px solid transparent;
  border-radius: var(--cx-ui-card-border-radius, 4px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-card-font-size, 14px);
  transition: box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cx-ui-card--bordered {
  border-color: var(--cx-ui-card-border-color, #e5e7eb);
}

.cx-ui-card--hoverable:hover {
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
}

.cx-ui-card--embedded {
  background-color: transparent;
  border-color: transparent;
}

/* Size modifiers — drive header/content/footer padding */
.cx-ui-card--small .cx-ui-card__header,
.cx-ui-card--small .cx-ui-card__content,
.cx-ui-card--small .cx-ui-card__footer {
  padding: var(--cx-ui-card-padding-small, 8px 12px);
}
.cx-ui-card--medium .cx-ui-card__header,
.cx-ui-card--medium .cx-ui-card__content,
.cx-ui-card--medium .cx-ui-card__footer {
  padding: var(--cx-ui-card-padding-medium, 12px 16px);
}
.cx-ui-card--large .cx-ui-card__header,
.cx-ui-card--large .cx-ui-card__content,
.cx-ui-card--large .cx-ui-card__footer {
  padding: var(--cx-ui-card-padding-large, 16px 20px);
}

/* Header row — separator below */
.cx-ui-card__header {
  font-weight: var(--cx-ui-card-title-font-weight, 600);
  font-size: var(--cx-ui-card-title-font-size, 16px);
  border-bottom: 1px solid var(--cx-ui-card-divider-color, #e5e7eb);
}
.cx-ui-card--embedded .cx-ui-card__header {
  border-bottom-color: transparent;
}

/* Content row — body */
.cx-ui-card__content {
  flex: 1 1 auto;
}

/* Footer row — separator above */
.cx-ui-card__footer {
  border-top: 1px solid var(--cx-ui-card-divider-color, #e5e7eb);
}
.cx-ui-card--embedded .cx-ui-card__footer {
  border-top-color: transparent;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'card';

let injected = false;

export function ensureChronixCardStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_CARD_CSS;
  document.head.appendChild(style);
  injected = true;
}
