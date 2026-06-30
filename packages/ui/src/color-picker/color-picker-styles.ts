/**
 * ColorPicker CSS — .
 *
 * BEM styles for cx-ui-color-picker + all sub-elements.
 * CSS var tokens with fallbacks for theme customization.
 */

export const CHRONIX_COLOR_PICKER_CSS = `
/* ── root ── */
.cx-ui-color-picker {
  position: relative;
  display: inline-flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
}

.cx-ui-color-picker--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-color-picker--open .cx-ui-color-picker__panel {
  opacity: 1;
  pointer-events: auto;
}

/* ── trigger ── */
.cx-ui-color-picker__trigger {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 10px;
  border: 1px solid var(--cx-ui-color-picker-border-color, #d9d9d9);
  border-radius: var(--cx-ui-color-picker-border-radius, var(--cx-ui-border-radius, 4px));
  background: var(--cx-ui-color-picker-bg, #fff);
  cursor: pointer;
  position: relative;
  transition: border-color 0.2s;
}

.cx-ui-color-picker__trigger:hover {
  border-color: var(--cx-ui-color-picker-border-color-hover, #4096ff);
}

.cx-ui-color-picker__trigger--empty .cx-ui-color-picker__color-preview {
  background: var(--cx-ui-color-picker-empty-bg, repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 12px 12px);
}

/* ── color preview ── */
.cx-ui-color-picker__color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--cx-ui-color-picker-preview-border, #d9d9d9);
  flex-shrink: 0;
}

/* ── panel ── */
.cx-ui-color-picker__panel {
  position: fixed;
  background: var(--cx-ui-color-picker-panel-bg, #fff);
  color: var(--cx-ui-color-picker-text-color, #1f2937);
  border: 1px solid var(--cx-ui-color-picker-panel-border-color, #e5e7eb);
  border-radius: var(--cx-ui-color-picker-panel-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-color-picker-panel-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 12px;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
  z-index: var(--cx-ui-color-picker-panel-z-index, 1050);
  width: 240px;
  box-sizing: border-box;
}

/* ── SV square ── */
.cx-ui-color-picker__square {
  position: relative;
  width: 216px;
  height: 180px;
  border-radius: 4px;
  cursor: crosshair;
  margin-bottom: 12px;
}

.cx-ui-color-picker__square-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ── hue strip ── */
.cx-ui-color-picker__hue-strip {
  position: relative;
  width: 216px;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
  cursor: pointer;
  margin-bottom: 8px;
}

.cx-ui-color-picker__hue-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ── alpha strip ── */
.cx-ui-color-picker__alpha-strip {
  position: relative;
  width: 216px;
  height: 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 8px;
  background: repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 8px 8px;
}

.cx-ui-color-picker__alpha-thumb {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ── hex input ── */
.cx-ui-color-picker__hex-input {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cx-ui-color-picker__hex-field {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--cx-ui-color-picker-border-color, #d9d9d9);
  border-radius: var(--cx-ui-border-radius, 4px);
  font-size: 13px;
  font-family: monospace;
  background: var(--cx-ui-color-picker-input-bg, #fff);
  color: var(--cx-ui-color-picker-text-color, #1f2937);
  outline: none;
  transition: border-color 0.2s;
}

.cx-ui-color-picker__hex-field:focus {
  border-color: var(--cx-ui-color-picker-border-color-active, #4096ff);
}

/* ── swatches ── */
.cx-ui-color-picker__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cx-ui-color-picker__swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--cx-ui-color-picker-swatch-border, #d9d9d9);
  transition: transform 0.15s, box-shadow 0.15s;
}

.cx-ui-color-picker__swatch:hover {
  transform: scale(1.15);
}

.cx-ui-color-picker__swatch--active {
  box-shadow: 0 0 0 2px var(--cx-ui-color-picker-swatch-active-ring, #4096ff);
}

/* ── clear ── */
.cx-ui-color-picker__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border: 1px solid var(--cx-ui-color-picker-border-color, #d9d9d9);
  border-radius: var(--cx-ui-border-radius, 4px);
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: var(--cx-ui-color-picker-text-color, #1f2937);
  margin-top: 8px;
}

.cx-ui-color-picker__clear:hover {
  border-color: var(--cx-ui-color-picker-border-color-hover, #4096ff);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'color-picker';

let injected = false;

export function ensureChronixColorPickerStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_COLOR_PICKER_CSS;
  document.head.appendChild(style);
  injected = true;
}
