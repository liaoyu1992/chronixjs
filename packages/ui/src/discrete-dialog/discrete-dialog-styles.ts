/**
 * Discrete Dialog stylesheet — Phase 36 (2026-06-05). Same pattern as
 * Alert/Button/Tag: single core CSS string, idempotent injection,
 * CSS-var token fallback.
 */
export const CHRONIX_DISCRETE_DIALOG_CSS = `
/* Mask overlay */
.cx-ui-dialog-mask {
  position: fixed;
  inset: 0;
  background-color: var(--cx-ui-dialog-mask-bg-color, rgba(0, 0, 0, 0.5));
  z-index: var(--cx-ui-dialog-z-index, 7000);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.25s ease;
}

/* Dialog card */
.cx-ui-dialog {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: var(--cx-ui-dialog-padding, 24px);
  border-radius: var(--cx-ui-dialog-border-radius, 8px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-dialog-font-size, 14px);
  line-height: 1.5;
  background-color: var(--cx-ui-dialog-bg-color, #ffffff);
  color: var(--cx-ui-dialog-text-color, #1f2937);
  box-shadow: var(--cx-ui-dialog-box-shadow, 0 6px 16px rgba(0, 0, 0, 0.2));
  max-width: var(--cx-ui-dialog-max-width, 480px);
  width: 100%;
  position: relative;
}

/* Title row */
.cx-ui-dialog__title {
  font-weight: var(--cx-ui-dialog-title-font-weight, 600);
  font-size: var(--cx-ui-dialog-title-font-size, 16px);
  margin-bottom: var(--cx-ui-dialog-title-margin-bottom, 8px);
}

/* Content body */
.cx-ui-dialog__content {
  margin-bottom: var(--cx-ui-dialog-content-margin-bottom, 20px);
  color: inherit;
}

/* Action row (positive + negative buttons) */
.cx-ui-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--cx-ui-dialog-actions-gap, 8px);
}

/* Close button */
.cx-ui-dialog__close {
  position: absolute;
  top: 14px;
  right: 14px;
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
.cx-ui-dialog__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.06);
}

/* Type variants — border-top accent */
.cx-ui-dialog--info {
  border-top: 3px solid var(--cx-ui-dialog-accent-color-info, #2080f0);
}
.cx-ui-dialog--success {
  border-top: 3px solid var(--cx-ui-dialog-accent-color-success, #18a058);
}
.cx-ui-dialog--warning {
  border-top: 3px solid var(--cx-ui-dialog-accent-color-warning, #f0a020);
}
.cx-ui-dialog--error {
  border-top: 3px solid var(--cx-ui-dialog-accent-color-error, #d03050);
}
.cx-ui-dialog--default {
  border-top: 3px solid var(--cx-ui-dialog-accent-color-default, #e5e7eb);
}

/* Fade enter / leave on mask */
.cx-ui-dialog-mask--enter {
  opacity: 0;
}
.cx-ui-dialog-mask--leave {
  opacity: 0;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'discrete-dialog';

let injected = false;

export function ensureChronixDiscreteDialogStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_DISCRETE_DIALOG_CSS;
  document.head.appendChild(style);
  injected = true;
}
