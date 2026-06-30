/**
 * DatePicker CSS — .
 *
 * BEM styles for cx-ui-date-picker + all sub-elements.
 * CSS var tokens with fallbacks for theme customization.
 */

export const CHRONIX_DATE_PICKER_CSS = `
/* ── root ── */
.cx-ui-date-picker {
  position: relative;
  display: inline-flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  width: var(--cx-ui-date-picker-width, 200px);
}

.cx-ui-date-picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-date-picker--open .cx-ui-date-picker__panel {
  opacity: 1;
  pointer-events: auto;
}

/* ── trigger ── */
.cx-ui-date-picker__trigger {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 28px 4px 10px;
  border: 1px solid var(--cx-ui-date-picker-border-color, #d9d9d9);
  border-radius: var(--cx-ui-date-picker-border-radius, var(--cx-ui-border-radius, 4px));
  background: var(--cx-ui-date-picker-bg, #fff);
  color: var(--cx-ui-date-picker-text-color, #1f2937);
  cursor: pointer;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.cx-ui-date-picker__trigger:hover {
  border-color: var(--cx-ui-date-picker-border-color-hover, #4096ff);
}

.cx-ui-date-picker__trigger--active {
  border-color: var(--cx-ui-date-picker-border-color-active, #4096ff);
  box-shadow: 0 0 0 2px var(--cx-ui-date-picker-outline-color, rgba(64, 150, 255, 0.2));
}

.cx-ui-date-picker__trigger--placeholder {
  color: var(--cx-ui-date-picker-placeholder-color, #bfbfbf);
}

/* ── value text ── */
.cx-ui-date-picker__value-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── calendar icon ── */
.cx-ui-date-picker__icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 14px;
  color: var(--cx-ui-date-picker-icon-color, #bfbfbf);
}

/* ── clear ── */
.cx-ui-date-picker__clear {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 12px;
  color: #999;
}

/* ── panel ── */
.cx-ui-date-picker__panel {
  position: fixed;
  background: var(--cx-ui-date-picker-panel-bg, #fff);
  color: var(--cx-ui-date-picker-text-color, #1f2937);
  border: 1px solid var(--cx-ui-date-picker-panel-border-color, #e5e7eb);
  border-radius: var(--cx-ui-date-picker-panel-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-date-picker-panel-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 12px;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
  z-index: var(--cx-ui-date-picker-panel-z-index, 1050);
  width: 280px;
  box-sizing: border-box;
}

/* ── header ── */
.cx-ui-date-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cx-ui-date-picker__header-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: var(--cx-ui-date-picker-text-color, #1f2937);
  font-size: 14px;
  padding: 0;
}

.cx-ui-date-picker__header-btn:hover {
  background: var(--cx-ui-date-picker-header-btn-hover-bg, #f3f4f6);
}

.cx-ui-date-picker__header-label {
  font-weight: 600;
  font-size: 14px;
  user-select: none;
}

/* ── weekdays ── */
.cx-ui-date-picker__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 4px;
}

.cx-ui-date-picker__weekday {
  font-size: 12px;
  color: var(--cx-ui-date-picker-weekday-color, #6b7280);
  padding: 4px 0;
  user-select: none;
}

/* ── days grid ── */
.cx-ui-date-picker__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cx-ui-date-picker__day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 100%;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
  user-select: none;
}

.cx-ui-date-picker__day:hover:not(.cx-ui-date-picker__day--disabled):not(.cx-ui-date-picker__day--other-month) {
  background: var(--cx-ui-date-picker-day-hover-bg, #f3f4f6);
}

.cx-ui-date-picker__day--other-month {
  color: var(--cx-ui-date-picker-other-month-color, #d1d5db);
  cursor: default;
}

.cx-ui-date-picker__day--today {
  font-weight: 700;
  color: var(--cx-ui-date-picker-today-color, #4096ff);
}

.cx-ui-date-picker__day--selected {
  background: var(--cx-ui-date-picker-selected-bg, #4096ff);
  color: var(--cx-ui-date-picker-selected-color, #fff);
  font-weight: 500;
}

.cx-ui-date-picker__day--selected.cx-ui-date-picker__day--today {
  color: #fff;
}

.cx-ui-date-picker__day--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'date-picker';

let injected = false;

export function ensureChronixDatePickerStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_DATE_PICKER_CSS;
  document.head.appendChild(style);
  injected = true;
}
