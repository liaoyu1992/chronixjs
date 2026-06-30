/**
 * Result stylesheet — .
 *
 * Layout: centered column with icon (large), title (medium-bold),
 * description (muted), then optional extra row (actions). HTTP-code
 * status modifiers map to error/warning color tokens by default but
 * carry their own selector so consumers can theme them separately.
 *
 * Two-level fallback (`var(--cx-ui-result-*, fallback)`) keeps the
 * surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_RESULT_CSS = `
.cx-ui-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 32px;
  color: var(--cx-ui-result-text-color, #1f2937);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-result-font-size, 14px);
}

.cx-ui-result__icon {
  font-size: var(--cx-ui-result-icon-size, 64px);
  line-height: 1;
}

.cx-ui-result__title {
  font-weight: var(--cx-ui-result-title-font-weight, 600);
  font-size: var(--cx-ui-result-title-font-size, 18px);
  color: var(--cx-ui-result-title-color, #1f2937);
}

.cx-ui-result__description {
  color: var(--cx-ui-result-description-color, #6b7280);
}

.cx-ui-result__extra {
  margin-top: 8px;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

/* Semantic status — title color tokens */
.cx-ui-result--status-default .cx-ui-result__title {
  color: var(--cx-ui-result-title-color, #1f2937);
}
.cx-ui-result--status-info .cx-ui-result__title {
  color: var(--cx-ui-result-title-color-info, #2080f0);
}
.cx-ui-result--status-success .cx-ui-result__title {
  color: var(--cx-ui-result-title-color-success, #18a058);
}
.cx-ui-result--status-warning .cx-ui-result__title {
  color: var(--cx-ui-result-title-color-warning, #f0a020);
}
.cx-ui-result--status-error .cx-ui-result__title {
  color: var(--cx-ui-result-title-color-error, #d03050);
}

/* HTTP codes — default to error/warning palette but with own selector
   so consumers can theme each separately. */
.cx-ui-result--status-404 .cx-ui-result__title,
.cx-ui-result--status-403 .cx-ui-result__title,
.cx-ui-result--status-500 .cx-ui-result__title {
  color: var(--cx-ui-result-title-color-error, #d03050);
}
.cx-ui-result--status-418 .cx-ui-result__title {
  color: var(--cx-ui-result-title-color-warning, #f0a020);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'result';

let injected = false;

/**
 * Inject the Result stylesheet into `document.head` exactly once.
 * Sticky-flag semantics.
 */
export function ensureChronixResultStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_RESULT_CSS;
  document.head.appendChild(style);
  injected = true;
}
