/**
 * Calendar CSS — .
 *
 * BEM styles for cx-ui-calendar (standalone calendar, no popup).
 * CSS var tokens with fallbacks for theme customization.
 */

export const CHRONIX_CALENDAR_CSS = `
/* ── root ── */
.cx-ui-calendar {
  position: relative;
  display: inline-block;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  background: var(--cx-ui-calendar-bg, #fff);
  border: 1px solid var(--cx-ui-calendar-border-color, #e5e7eb);
  border-radius: var(--cx-ui-calendar-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-calendar-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  padding: 16px;
  width: var(--cx-ui-calendar-width, 320px);
  box-sizing: border-box;
}

.cx-ui-calendar--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ── header ── */
.cx-ui-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cx-ui-calendar__header-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: var(--cx-ui-calendar-text-color, #1f2937);
  font-size: 14px;
  padding: 0;
}

.cx-ui-calendar__header-btn:hover {
  background: var(--cx-ui-calendar-header-btn-hover-bg, #f3f4f6);
}

.cx-ui-calendar__header-label {
  font-weight: 600;
  font-size: 16px;
  user-select: none;
}

/* ── weekdays ── */
.cx-ui-calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 4px;
}

.cx-ui-calendar__weekday {
  font-size: 12px;
  color: var(--cx-ui-calendar-weekday-color, #6b7280);
  padding: 6px 0;
  user-select: none;
}

/* ── days grid ── */
.cx-ui-calendar__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cx-ui-calendar__day {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  width: 100%;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s, color 0.15s;
  user-select: none;
}

.cx-ui-calendar__day:hover:not(.cx-ui-calendar__day--disabled):not(.cx-ui-calendar__day--other-month) {
  background: var(--cx-ui-calendar-day-hover-bg, #f3f4f6);
}

.cx-ui-calendar__day--other-month {
  color: var(--cx-ui-calendar-other-month-color, #d1d5db);
  cursor: default;
}

.cx-ui-calendar__day--today {
  font-weight: 700;
  color: var(--cx-ui-calendar-today-color, #4096ff);
}

.cx-ui-calendar__day--selected {
  background: var(--cx-ui-calendar-selected-bg, #4096ff);
  color: var(--cx-ui-calendar-selected-color, #fff);
  font-weight: 500;
}

.cx-ui-calendar__day--selected.cx-ui-calendar__day--today {
  color: #fff;
}

.cx-ui-calendar__day--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'calendar';

let injected = false;

export function ensureChronixCalendarStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_CALENDAR_CSS;
  document.head.appendChild(style);
  injected = true;
}
