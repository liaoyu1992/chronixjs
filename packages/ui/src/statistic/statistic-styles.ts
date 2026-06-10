/**
 * Statistic stylesheet — Phase 18 (2026-06-02).
 */
export const CHRONIX_STATISTIC_CSS = `
.cx-ui-statistic {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  color: var(--cx-ui-statistic-text-color, #1f2937);
}

.cx-ui-statistic__label {
  font-size: var(--cx-ui-statistic-label-font-size, 13px);
  color: var(--cx-ui-statistic-label-color, #6b7280);
  font-weight: var(--cx-ui-statistic-label-font-weight, 400);
}

.cx-ui-statistic__content {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: var(--cx-ui-statistic-value-font-size, 24px);
  line-height: 1.2;
}

.cx-ui-statistic__prefix,
.cx-ui-statistic__suffix {
  font-size: var(--cx-ui-statistic-affix-font-size, 14px);
  color: var(--cx-ui-statistic-affix-color, #6b7280);
}

.cx-ui-statistic__value {
  font-weight: var(--cx-ui-statistic-value-font-weight, 500);
  color: var(--cx-ui-statistic-value-color, #1f2937);
}

.cx-ui-statistic--tabular-nums .cx-ui-statistic__value {
  font-variant-numeric: tabular-nums;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'statistic';

let injected = false;

export function ensureChronixStatisticStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_STATISTIC_CSS;
  document.head.appendChild(style);
  injected = true;
}
