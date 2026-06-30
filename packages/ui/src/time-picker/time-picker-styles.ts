/**
 * TimePicker CSS — .
 *
 * BEM styles for cx-ui-time-picker + all sub-elements.
 * CSS var tokens with fallbacks for theme customization.
 */

export const CHRONIX_TIME_PICKER_CSS = `
/* ── root ── */
.cx-ui-time-picker {
  position: relative;
  display: inline-flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  width: var(--cx-ui-time-picker-width, 200px);
}

.cx-ui-time-picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-time-picker--open .cx-ui-time-picker__panel {
  opacity: 1;
  pointer-events: auto;
}

/* ── trigger ── */
.cx-ui-time-picker__trigger {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 28px 4px 10px;
  border: 1px solid var(--cx-ui-time-picker-border-color, #d9d9d9);
  border-radius: var(--cx-ui-time-picker-border-radius, var(--cx-ui-border-radius, 4px));
  background: var(--cx-ui-time-picker-bg, #fff);
  color: var(--cx-ui-time-picker-text-color, #1f2937);
  cursor: pointer;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.cx-ui-time-picker__trigger:hover {
  border-color: var(--cx-ui-time-picker-border-color-hover, #4096ff);
}

.cx-ui-time-picker__trigger--active {
  border-color: var(--cx-ui-time-picker-border-color-active, #4096ff);
  box-shadow: 0 0 0 2px var(--cx-ui-time-picker-outline-color, rgba(64, 150, 255, 0.2));
}

.cx-ui-time-picker__trigger--placeholder {
  color: var(--cx-ui-time-picker-placeholder-color, #bfbfbf);
}

/* ── value text ── */
.cx-ui-time-picker__value-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── clock icon ── */
.cx-ui-time-picker__icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 14px;
  color: var(--cx-ui-time-picker-icon-color, #bfbfbf);
}

/* ── clear ── */
.cx-ui-time-picker__clear {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 12px;
  color: #999;
}

/* ── panel ── */
.cx-ui-time-picker__panel {
  position: fixed;
  background: var(--cx-ui-time-picker-panel-bg, #fff);
  color: var(--cx-ui-time-picker-text-color, #1f2937);
  border: 1px solid var(--cx-ui-time-picker-panel-border-color, #e5e7eb);
  border-radius: var(--cx-ui-time-picker-panel-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-time-picker-panel-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 8px 0;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
  z-index: var(--cx-ui-time-picker-panel-z-index, 1050);
  box-sizing: border-box;
  display: flex;
  min-width: 160px;
}

/* ── columns ── */
.cx-ui-time-picker__columns {
  display: flex;
  flex: 1;
}

.cx-ui-time-picker__column {
  flex: 1;
  max-height: 224px;
  overflow-y: auto;
  border-right: 1px solid var(--cx-ui-time-picker-column-border-color, #f0f0f0);
  scrollbar-width: thin;
}

.cx-ui-time-picker__column:last-child {
  border-right: none;
}

/* ── item ── */
.cx-ui-time-picker__item {
  padding: 6px 12px;
  cursor: pointer;
  text-align: center;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
  user-select: none;
}

.cx-ui-time-picker__item:hover:not(.cx-ui-time-picker__item--disabled) {
  background: var(--cx-ui-time-picker-item-hover-bg, #f3f4f6);
}

.cx-ui-time-picker__item--selected {
  background: var(--cx-ui-time-picker-selected-bg, #4096ff);
  color: var(--cx-ui-time-picker-selected-color, #fff);
  font-weight: 500;
}

.cx-ui-time-picker__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'time-picker';

let injected = false;

export function ensureChronixTimePickerStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TIME_PICKER_CSS;
  document.head.appendChild(style);
  injected = true;
}
