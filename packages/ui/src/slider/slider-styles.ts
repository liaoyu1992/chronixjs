/**
 * Slider CSS — Phase 33 (2026-06-05).
 *
 * BEM styles for cx-ui-slider + all sub-elements.
 * CSS var tokens with fallbacks for theme customization.
 */

export const CHRONIX_SLIDER_CSS = `
/* ── root ── */
.cx-ui-slider {
  position: relative;
  display: flex;
  align-items: center;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  width: 100%;
  height: 20px;
  cursor: pointer;
  user-select: none;
  padding: 8px 0;
}

.cx-ui-slider--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cx-ui-slider--vertical {
  flex-direction: column;
  width: 20px;
  height: auto;
  min-height: 100px;
  padding: 0 8px;
}

/* ── track ── */
.cx-ui-slider__track {
  position: relative;
  flex: 1;
  height: 6px;
  background: var(--cx-ui-slider-track-bg, #e5e7eb);
  border-radius: 3px;
}

.cx-ui-slider--vertical .cx-ui-slider__track {
  width: 6px;
  height: 100%;
  flex: none;
}

/* ── fill ── */
.cx-ui-slider__fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--cx-ui-slider-fill-bg, #4096ff);
  border-radius: 3px;
  pointer-events: none;
}

.cx-ui-slider--vertical .cx-ui-slider__fill {
  width: 100%;
  height: auto;
  bottom: 0;
  top: auto;
  left: 0;
}

/* ── thumb ── */
.cx-ui-slider__thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--cx-ui-slider-thumb-bg, #fff);
  border: 2px solid var(--cx-ui-slider-thumb-border, #4096ff);
  transform: translate(-50%, -50%);
  transition: box-shadow 0.2s, transform 0.15s;
  z-index: 1;
  cursor: grab;
}

.cx-ui-slider__thumb:hover {
  box-shadow: 0 0 0 4px var(--cx-ui-slider-thumb-ring, rgba(64, 150, 255, 0.2));
}

.cx-ui-slider__thumb--dragging {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 0 0 6px var(--cx-ui-slider-thumb-ring, rgba(64, 150, 255, 0.2));
}

.cx-ui-slider--vertical .cx-ui-slider__thumb {
  left: 50%;
  top: auto;
  transform: translate(-50%, 50%);
}

.cx-ui-slider--vertical .cx-ui-slider__thumb--dragging {
  transform: translate(-50%, 50%) scale(1.2);
}

/* ── tooltip ── */
.cx-ui-slider__tooltip {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 8px;
  background: var(--cx-ui-slider-tooltip-bg, #1f2937);
  color: var(--cx-ui-slider-tooltip-color, #fff);
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
}

.cx-ui-slider__tooltip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid var(--cx-ui-slider-tooltip-bg, #1f2937);
}

/* ── marks ── */
.cx-ui-slider__marks {
  position: relative;
  width: 100%;
  height: 20px;
  margin-top: 4px;
}

.cx-ui-slider--vertical .cx-ui-slider__marks {
  width: 20px;
  height: 100%;
  margin-top: 0;
  margin-left: 4px;
}

.cx-ui-slider__mark {
  position: absolute;
  top: 0;
  width: 2px;
  height: 6px;
  background: var(--cx-ui-slider-mark-bg, #9ca3af);
  transform: translateX(-50%);
}

.cx-ui-slider__mark--active {
  background: var(--cx-ui-slider-fill-bg, #4096ff);
}

.cx-ui-slider__mark-label {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--cx-ui-slider-mark-label-color, #6b7280);
  white-space: nowrap;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'slider';

let injected = false;

export function ensureChronixSliderStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_SLIDER_CSS;
  document.head.appendChild(style);
  injected = true;
}
