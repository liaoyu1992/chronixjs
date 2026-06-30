/**
 * Pagination CSS — .
 *
 * BEM styles for cx-ui-pagination + all sub-elements.
 * CSS var tokens with fallbacks for theme customization.
 */

export const CHRONIX_PAGINATION_CSS = `
/* ── root ── */
.cx-ui-pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  user-select: none;
}

.cx-ui-pagination--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ── button (prev/next) ── */
.cx-ui-pagination__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid var(--cx-ui-pagination-border-color, #d9d9d9);
  border-radius: var(--cx-ui-border-radius, 4px);
  background: var(--cx-ui-pagination-btn-bg, #fff);
  color: var(--cx-ui-pagination-text-color, #1f2937);
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.2s, color 0.2s;
}

.cx-ui-pagination__btn:hover:not(.cx-ui-pagination__btn--disabled) {
  border-color: var(--cx-ui-pagination-border-color-active, #4096ff);
  color: var(--cx-ui-pagination-border-color-active, #4096ff);
}

.cx-ui-pagination__btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── item (page number) ── */
.cx-ui-pagination__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--cx-ui-border-radius, 4px);
  background: transparent;
  color: var(--cx-ui-pagination-text-color, #1f2937);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.cx-ui-pagination__item:hover:not(.cx-ui-pagination__item--active):not(.cx-ui-pagination__item--disabled) {
  border-color: var(--cx-ui-pagination-border-color, #d9d9d9);
  background: var(--cx-ui-pagination-item-hover-bg, #f3f4f6);
}

.cx-ui-pagination__item--active {
  border-color: var(--cx-ui-pagination-border-color-active, #4096ff);
  background: var(--cx-ui-pagination-active-bg, #4096ff);
  color: var(--cx-ui-pagination-active-color, #fff);
  font-weight: 500;
}

.cx-ui-pagination__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── ellipsis ── */
.cx-ui-pagination__ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  color: var(--cx-ui-pagination-ellipsis-color, #9ca3af);
  font-size: 14px;
  cursor: default;
}

/* ── jumper ── */
.cx-ui-pagination__jumper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  font-size: 13px;
  color: var(--cx-ui-pagination-text-color, #1f2937);
}

.cx-ui-pagination__jumper-input {
  width: 48px;
  height: 28px;
  padding: 0 4px;
  border: 1px solid var(--cx-ui-pagination-border-color, #d9d9d9);
  border-radius: var(--cx-ui-border-radius, 4px);
  font-size: 13px;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}

.cx-ui-pagination__jumper-input:focus {
  border-color: var(--cx-ui-pagination-border-color-active, #4096ff);
}

/* ── size picker ── */
.cx-ui-pagination__size-picker {
  margin-left: 8px;
}

.cx-ui-pagination__size-select {
  padding: 2px 8px;
  border: 1px solid var(--cx-ui-pagination-border-color, #d9d9d9);
  border-radius: var(--cx-ui-border-radius, 4px);
  font-size: 13px;
  outline: none;
  background: var(--cx-ui-pagination-btn-bg, #fff);
  color: var(--cx-ui-pagination-text-color, #1f2937);
  transition: border-color 0.2s;
}

.cx-ui-pagination__size-select:focus {
  border-color: var(--cx-ui-pagination-border-color-active, #4096ff);
}

/* ── total ── */
.cx-ui-pagination__total {
  font-size: 13px;
  color: var(--cx-ui-pagination-text-color, #1f2937);
  margin-right: 8px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'pagination';

let injected = false;

export function ensureChronixPaginationStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_PAGINATION_CSS;
  document.head.appendChild(style);
  injected = true;
}
