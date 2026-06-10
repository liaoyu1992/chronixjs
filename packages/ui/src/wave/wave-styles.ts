export const CHRONIX_WAVE_CSS = `
.cx-ui-wave {
  position: relative;
  display: inline-block;
  overflow: hidden;
}

.cx-ui-wave::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--cx-ui-wave-color, rgba(37, 99, 235, 0.3));
  opacity: 0;
  pointer-events: none;
}

.cx-ui-wave--rippling::after {
  animation: cx-ui-wave-ripple 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cx-ui-wave--disabled::after {
  display: none;
}

@keyframes cx-ui-wave-ripple {
  0% {
    transform: scale(0);
    opacity: 0.6;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'wave';

let injected = false;

export function ensureChronixWaveStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_WAVE_CSS;
  document.head.appendChild(style);
  injected = true;
}
