/**
 * Countdown stylesheet — Phase 18 (2026-06-02).
 *
 * Same shape as Statistic — `(label, content with prefix/value/suffix)`
 * — but its own selector tree so consumers can theme the ticking
 * display independently (e.g. monospace + larger font for OTP timers).
 */
export const CHRONIX_COUNTDOWN_CSS = `
.cx-ui-countdown {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  color: var(--cx-ui-countdown-text-color, #1f2937);
}

.cx-ui-countdown__label {
  font-size: var(--cx-ui-countdown-label-font-size, 13px);
  color: var(--cx-ui-countdown-label-color, #6b7280);
  font-weight: var(--cx-ui-countdown-label-font-weight, 400);
}

.cx-ui-countdown__content {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  font-size: var(--cx-ui-countdown-value-font-size, 24px);
  line-height: 1.2;
}

.cx-ui-countdown__prefix,
.cx-ui-countdown__suffix {
  font-size: var(--cx-ui-countdown-affix-font-size, 14px);
  color: var(--cx-ui-countdown-affix-color, #6b7280);
}

.cx-ui-countdown__value {
  font-weight: var(--cx-ui-countdown-value-font-weight, 500);
  color: var(--cx-ui-countdown-value-color, #1f2937);
}

.cx-ui-countdown--tabular-nums .cx-ui-countdown__value {
  font-variant-numeric: tabular-nums;
}

.cx-ui-countdown--paused {
  opacity: var(--cx-ui-countdown-paused-opacity, 0.6);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'countdown';

let injected = false;

export function ensureChronixCountdownStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_COUNTDOWN_CSS;
  document.head.appendChild(style);
  injected = true;
}
