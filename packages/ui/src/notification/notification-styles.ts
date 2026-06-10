/**
 * Notification stylesheet — Phase 36 (2026-06-05). Same pattern as
 * Alert/Button/Tag: single core CSS string, idempotent injection,
 * CSS-var token fallback.
 */
export const CHRONIX_NOTIFICATION_CSS = `
.cx-ui-notification {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: var(--cx-ui-notification-padding, 16px 20px);
  border-radius: var(--cx-ui-notification-border-radius, 6px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-notification-font-size, 14px);
  line-height: 1.5;
  position: fixed;
  pointer-events: auto;
  background-color: var(--cx-ui-notification-bg-color, #ffffff);
  color: var(--cx-ui-notification-text-color, #1f2937);
  box-shadow: var(--cx-ui-notification-box-shadow, 0 4px 12px rgba(0, 0, 0, 0.15));
  border: 1px solid var(--cx-ui-notification-border-color, #e5e7eb);
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: var(--cx-ui-notification-z-index, 6000);
  max-width: var(--cx-ui-notification-max-width, 380px);
}

/* Title row */
.cx-ui-notification__title {
  font-weight: var(--cx-ui-notification-title-font-weight, 600);
  font-size: var(--cx-ui-notification-title-font-size, 16px);
  margin-bottom: var(--cx-ui-notification-title-margin-bottom, 4px);
}

/* Description row */
.cx-ui-notification__description {
  color: var(--cx-ui-notification-description-color, #6b7280);
  font-size: var(--cx-ui-notification-description-font-size, 14px);
}

/* Close button */
.cx-ui-notification__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  border-radius: 2px;
  opacity: 0.6;
}
.cx-ui-notification__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.06);
}

/* Type variants — border-left accent */
.cx-ui-notification--info {
  border-left: 4px solid var(--cx-ui-notification-accent-color-info, #2080f0);
}
.cx-ui-notification--success {
  border-left: 4px solid var(--cx-ui-notification-accent-color-success, #18a058);
}
.cx-ui-notification--warning {
  border-left: 4px solid var(--cx-ui-notification-accent-color-warning, #f0a020);
}
.cx-ui-notification--error {
  border-left: 4px solid var(--cx-ui-notification-accent-color-error, #d03050);
}

/* Fade enter / leave */
.cx-ui-notification--enter {
  opacity: 0;
  transform: translateX(16px);
}
.cx-ui-notification--leave {
  opacity: 0;
  transform: translateX(16px);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'notification';

let injected = false;

export function ensureChronixNotificationStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_NOTIFICATION_CSS;
  document.head.appendChild(style);
  injected = true;
}
