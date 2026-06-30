/**
 * Message stylesheet — . Same pattern as
 * Alert/Button/Tag: single core CSS string, idempotent injection,
 * CSS-var token fallback.
 */
export const CHRONIX_MESSAGE_CSS = `
.cx-ui-message {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: var(--cx-ui-message-padding, 10px 16px);
  border-radius: var(--cx-ui-message-border-radius, 4px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-message-font-size, 14px);
  line-height: 1.5;
  position: fixed;
  pointer-events: auto;
  box-shadow: var(--cx-ui-message-box-shadow, 0 2px 8px rgba(0, 0, 0, 0.12));
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: var(--cx-ui-message-z-index, 6000);
}

/* Content */
.cx-ui-message__content {
  flex: 1;
  color: inherit;
}

/* Close button */
.cx-ui-message__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 8px;
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
.cx-ui-message__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.06);
}

/* Type variants */
.cx-ui-message--info {
  background-color: var(--cx-ui-message-bg-color-info, rgba(32, 128, 240, 0.1));
  color: var(--cx-ui-message-text-color-info, #2080f0);
  border: 1px solid var(--cx-ui-message-border-color-info, rgba(32, 128, 240, 0.3));
}
.cx-ui-message--success {
  background-color: var(--cx-ui-message-bg-color-success, rgba(24, 160, 88, 0.1));
  color: var(--cx-ui-message-text-color-success, #18a058);
  border: 1px solid var(--cx-ui-message-border-color-success, rgba(24, 160, 88, 0.3));
}
.cx-ui-message--warning {
  background-color: var(--cx-ui-message-bg-color-warning, rgba(240, 160, 32, 0.1));
  color: var(--cx-ui-message-text-color-warning, #f0a020);
  border: 1px solid var(--cx-ui-message-border-color-warning, rgba(240, 160, 32, 0.3));
}
.cx-ui-message--error {
  background-color: var(--cx-ui-message-bg-color-error, rgba(208, 48, 80, 0.1));
  color: var(--cx-ui-message-text-color-error, #d03050);
  border: 1px solid var(--cx-ui-message-border-color-error, rgba(208, 48, 80, 0.3));
}
.cx-ui-message--loading {
  background-color: var(--cx-ui-message-bg-color-loading, rgba(32, 128, 240, 0.1));
  color: var(--cx-ui-message-text-color-loading, #2080f0);
  border: 1px solid var(--cx-ui-message-border-color-loading, rgba(32, 128, 240, 0.3));
}

/* Fade enter / leave */
.cx-ui-message--enter {
  opacity: 0;
  transform: translateY(-8px);
}
.cx-ui-message--leave {
  opacity: 0;
  transform: translateY(-8px);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'message';

let injected = false;

export function ensureChronixMessageStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_MESSAGE_CSS;
  document.head.appendChild(style);
  injected = true;
}
