/**
 * Transfer CSS — Phase 33 (2026-06-05).
 *
 * BEM styles for cx-ui-transfer + all sub-elements.
 * CSS var tokens with fallbacks for theme customization.
 */

export const CHRONIX_TRANSFER_CSS = `
/* ── root ── */
.cx-ui-transfer {
  display: inline-flex;
  align-items: flex-start;
  gap: 12px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
}

.cx-ui-transfer--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ── panel ── */
.cx-ui-transfer__panel {
  display: flex;
  flex-direction: column;
  width: var(--cx-ui-transfer-panel-width, 240px);
  min-height: 200px;
  border: 1px solid var(--cx-ui-transfer-border-color, #d9d9d9);
  border-radius: var(--cx-ui-transfer-border-radius, var(--cx-ui-border-radius, 4px));
  background: var(--cx-ui-transfer-panel-bg, #fff);
  overflow: hidden;
}

/* ── header ── */
.cx-ui-transfer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--cx-ui-transfer-border-color, #e5e7eb);
  background: var(--cx-ui-transfer-header-bg, #fafafa);
  font-weight: 500;
  user-select: none;
}

.cx-ui-transfer__header-checkbox {
  margin-right: 8px;
}

.cx-ui-transfer__header-title {
  flex: 1;
  font-size: 13px;
}

.cx-ui-transfer__header-count {
  font-size: 12px;
  color: var(--cx-ui-transfer-count-color, #6b7280);
}

/* ── filter ── */
.cx-ui-transfer__filter {
  padding: 8px;
  border-bottom: 1px solid var(--cx-ui-transfer-border-color, #f0f0f0);
}

.cx-ui-transfer__filter-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--cx-ui-transfer-border-color, #d9d9d9);
  border-radius: var(--cx-ui-border-radius, 4px);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.cx-ui-transfer__filter-input:focus {
  border-color: var(--cx-ui-transfer-border-color-active, #4096ff);
}

/* ── body ── */
.cx-ui-transfer__body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

/* ── item ── */
.cx-ui-transfer__item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.cx-ui-transfer__item:hover:not(.cx-ui-transfer__item--disabled) {
  background: var(--cx-ui-transfer-item-hover-bg, #f3f4f6);
}

.cx-ui-transfer__item--checked {
  background: var(--cx-ui-transfer-item-checked-bg, rgba(64, 150, 255, 0.08));
}

.cx-ui-transfer__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cx-ui-transfer__item-checkbox {
  margin-right: 8px;
  flex-shrink: 0;
}

.cx-ui-transfer__item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── actions ── */
.cx-ui-transfer__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 4px;
  align-self: center;
}

.cx-ui-transfer__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--cx-ui-transfer-border-color, #d9d9d9);
  border-radius: var(--cx-ui-border-radius, 4px);
  background: var(--cx-ui-transfer-action-bg, #fff);
  cursor: pointer;
  font-size: 14px;
  color: var(--cx-ui-transfer-text-color, #1f2937);
  transition: border-color 0.2s, background 0.2s;
  padding: 0;
}

.cx-ui-transfer__action-btn:hover:not(:disabled) {
  border-color: var(--cx-ui-transfer-border-color-active, #4096ff);
  color: var(--cx-ui-transfer-border-color-active, #4096ff);
}

.cx-ui-transfer__action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── empty ── */
.cx-ui-transfer__empty {
  padding: 16px 12px;
  text-align: center;
  color: var(--cx-ui-transfer-empty-color, #9ca3af);
  font-size: 13px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'transfer';

let injected = false;

export function ensureChronixTransferStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TRANSFER_CSS;
  document.head.appendChild(style);
  injected = true;
}
