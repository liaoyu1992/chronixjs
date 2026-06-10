/**
 * Alert stylesheet — Phase 15 (2026-06-02). Same pattern as
 * Button/Tag/Divider/Badge: single core CSS string, idempotent
 * injection, CSS-var token fallback.
 */
export const CHRONIX_ALERT_CSS = `
.cx-ui-alert {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: var(--cx-ui-alert-padding, 12px 16px);
  border: 1px solid transparent;
  border-radius: var(--cx-ui-alert-border-radius, 3px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-alert-font-size, 14px);
  line-height: 1.5;
  position: relative;
}

/* Reserve padding-right for the close button */
.cx-ui-alert--closable {
  padding-right: var(--cx-ui-alert-padding-close, 40px);
}

/* Title row */
.cx-ui-alert__title {
  font-weight: var(--cx-ui-alert-title-font-weight, 600);
  margin-bottom: var(--cx-ui-alert-title-margin-bottom, 4px);
}

/* Content row — wraps default slot children */
.cx-ui-alert__content {
  color: inherit;
}

/* Close button */
.cx-ui-alert__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  border-radius: 2px;
  opacity: 0.6;
}
.cx-ui-alert__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.06);
}

/* Type variants — bg + text */
.cx-ui-alert--default {
  background-color: var(--cx-ui-alert-bg-color, #f5f6f7);
  color: var(--cx-ui-alert-text-color, #1f2937);
}
.cx-ui-alert--info {
  background-color: var(--cx-ui-alert-bg-color-info, rgba(32, 128, 240, 0.08));
  color: var(--cx-ui-alert-text-color-info, #1f2937);
}
.cx-ui-alert--success {
  background-color: var(--cx-ui-alert-bg-color-success, rgba(24, 160, 88, 0.08));
  color: var(--cx-ui-alert-text-color-success, #1f2937);
}
.cx-ui-alert--warning {
  background-color: var(--cx-ui-alert-bg-color-warning, rgba(240, 160, 32, 0.08));
  color: var(--cx-ui-alert-text-color-warning, #1f2937);
}
.cx-ui-alert--error {
  background-color: var(--cx-ui-alert-bg-color-error, rgba(208, 48, 80, 0.08));
  color: var(--cx-ui-alert-text-color-error, #1f2937);
}

/* Bordered modifier — applies border color matching the type */
.cx-ui-alert--bordered.cx-ui-alert--default {
  border-color: var(--cx-ui-alert-border-color, #e5e7eb);
}
.cx-ui-alert--bordered.cx-ui-alert--info {
  border-color: var(--cx-ui-alert-border-color-info, #2080f0);
}
.cx-ui-alert--bordered.cx-ui-alert--success {
  border-color: var(--cx-ui-alert-border-color-success, #18a058);
}
.cx-ui-alert--bordered.cx-ui-alert--warning {
  border-color: var(--cx-ui-alert-border-color-warning, #f0a020);
}
.cx-ui-alert--bordered.cx-ui-alert--error {
  border-color: var(--cx-ui-alert-border-color-error, #d03050);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'alert';

let injected = false;

export function ensureChronixAlertStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_ALERT_CSS;
  document.head.appendChild(style);
  injected = true;
}
