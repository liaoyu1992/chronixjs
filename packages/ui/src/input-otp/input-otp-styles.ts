export const CHRONIX_INPUT_OTP_CSS = `
.cx-ui-otp {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-otp__cell {
  width: 36px;
  height: 40px;
  text-align: center;
  border: 1px solid var(--cx-ui-otp-border-color, #d1d5db);
  border-radius: var(--cx-ui-otp-border-radius, var(--cx-ui-border-radius, 3px));
  background: var(--cx-ui-otp-bg, #fff);
  font: inherit;
  font-size: 18px;
  outline: 0;
  color: var(--cx-ui-otp-text-color, #1f2937);
}

.cx-ui-otp__cell:focus {
  border-color: var(--cx-ui-otp-focus-border-color, var(--cx-ui-primary-color, #2563eb));
}

.cx-ui-otp--disabled .cx-ui-otp__cell {
  opacity: 0.6;
  cursor: not-allowed;
  background: var(--cx-ui-otp-disabled-bg, #f3f4f6);
}

.cx-ui-otp--invalid .cx-ui-otp__cell {
  border-color: var(--cx-ui-otp-invalid-border-color, #dc2626);
}

.cx-ui-otp__error {
  display: block;
  margin-top: 4px;
  color: var(--cx-ui-otp-invalid-text-color, #dc2626);
  font-size: 12px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'input-otp';

let injected = false;

export function ensureChronixInputOtpStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_INPUT_OTP_CSS;
  document.head.appendChild(style);
  injected = true;
}
