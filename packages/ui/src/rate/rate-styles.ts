export const CHRONIX_RATE_CSS = `
.cx-ui-rate {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-rate__star {
  display: inline-flex;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  color: var(--cx-ui-rate-empty-color, #d1d5db);
  font-size: 0;
  line-height: 0;
  position: relative;
}

.cx-ui-rate__star svg {
  width: 20px;
  height: 20px;
  display: block;
}

.cx-ui-rate__star--full {
  color: var(--cx-ui-rate-full-color, #f59e0b);
}

.cx-ui-rate__star--half {
  color: var(--cx-ui-rate-empty-color, #d1d5db);
}

.cx-ui-rate__star--half::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: var(--cx-ui-rate-full-color, #f59e0b);
  -webkit-mask: var(--cx-ui-rate-mask-star) center / contain no-repeat;
  mask: var(--cx-ui-rate-mask-star) center / contain no-repeat;
  pointer-events: none;
}

.cx-ui-rate--disabled .cx-ui-rate__star,
.cx-ui-rate--readonly .cx-ui-rate__star {
  cursor: default;
}

.cx-ui-rate--disabled {
  opacity: 0.6;
}

.cx-ui-rate--invalid .cx-ui-rate__star {
  outline: 1px solid var(--cx-ui-rate-invalid-border-color, #dc2626);
}

.cx-ui-rate__error {
  display: block;
  width: 100%;
  margin-top: 4px;
  color: var(--cx-ui-rate-invalid-text-color, #dc2626);
  font-size: 12px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'rate';

let injected = false;

export function ensureChronixRateStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_RATE_CSS;
  document.head.appendChild(style);
  injected = true;
}
