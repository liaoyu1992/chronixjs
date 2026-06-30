/**
 * Select CSS — .
 *
 * BEM styles for cx-ui-select + all sub-elements. CSS var tokens
 * with fallbacks for theme customization.
 */

export const CHRONIX_SELECT_CSS = `
/* ── root ── */
.cx-ui-select {
  position: relative;
  display: inline-flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  width: var(--cx-ui-select-width, 200px);
}

.cx-ui-select--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-select--open .cx-ui-select__dropdown {
  opacity: 1;
  pointer-events: auto;
}

/* ── trigger ── */
.cx-ui-select__trigger {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 28px 4px 10px;
  border: 1px solid var(--cx-ui-select-border-color, #d9d9d9);
  border-radius: var(--cx-ui-select-border-radius, var(--cx-ui-border-radius, 4px));
  background: var(--cx-ui-select-bg, #fff);
  color: var(--cx-ui-select-text-color, #1f2937);
  cursor: pointer;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.cx-ui-select__trigger:hover {
  border-color: var(--cx-ui-select-border-color-hover, #4096ff);
}

.cx-ui-select__trigger--active {
  border-color: var(--cx-ui-select-border-color-active, #4096ff);
  box-shadow: 0 0 0 2px var(--cx-ui-select-outline-color, rgba(64, 150, 255, 0.2));
}

.cx-ui-select__trigger--placeholder {
  color: var(--cx-ui-select-placeholder-color, #bfbfbf);
}

.cx-ui-select--multiple .cx-ui-select__trigger {
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px 28px 2px 4px;
  min-height: 32px;
}

/* ── value text ── */
.cx-ui-select__value-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── arrow ── */
.cx-ui-select__arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%) rotate(0deg);
  transition: transform 0.2s;
  pointer-events: none;
  font-size: 12px;
  color: var(--cx-ui-select-arrow-color, #bfbfbf);
}

.cx-ui-select__arrow--active {
  transform: translateY(-50%) rotate(180deg);
}

/* ── dropdown ── */
.cx-ui-select__dropdown {
  position: fixed;
  background: var(--cx-ui-select-dropdown-bg, #fff);
  color: var(--cx-ui-select-text-color, #1f2937);
  border: 1px solid var(--cx-ui-select-dropdown-border-color, #e5e7eb);
  border-radius: var(--cx-ui-select-dropdown-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-select-dropdown-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 4px 0;
  max-height: 256px;
  overflow-y: auto;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
  z-index: var(--cx-ui-select-dropdown-z-index, 1050);
}

/* ── filter input ── */
.cx-ui-select__filter-input {
  display: block;
  width: calc(100% - 16px);
  margin: 4px 8px;
  padding: 4px 8px;
  border: 1px solid var(--cx-ui-select-border-color, #d9d9d9);
  border-radius: var(--cx-ui-select-border-radius, var(--cx-ui-border-radius, 4px));
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.cx-ui-select__filter-input:focus {
  border-color: var(--cx-ui-select-border-color-active, #4096ff);
}

/* ── option ── */
.cx-ui-select__option {
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  line-height: 1.4;
}

.cx-ui-select__option--group-label {
  font-weight: 600;
  color: var(--cx-ui-select-group-label-color, #6b7280);
  cursor: default;
  padding-left: 8px;
}

.cx-ui-select__option:not(.cx-ui-select__option--disabled):not(.cx-ui-select__option--group-label):hover {
  background: var(--cx-ui-select-option-hover-bg, #f3f4f6);
}

.cx-ui-select__option--focused:not(.cx-ui-select__option--group-label) {
  background: var(--cx-ui-select-option-focus-bg, #f3f4f6);
}

.cx-ui-select__option--selected {
  background: var(--cx-ui-select-option-selected-bg, rgba(64, 150, 255, 0.08));
  color: var(--cx-ui-select-option-selected-color, #4096ff);
  font-weight: 500;
}

.cx-ui-select__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── empty ── */
.cx-ui-select__empty {
  padding: 10px 12px;
  color: var(--cx-ui-select-empty-color, #bfbfbf);
  text-align: center;
  font-size: 14px;
}

/* ── tag (multi-select) ── */
.cx-ui-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  height: 22px;
  background: var(--cx-ui-select-tag-bg, #f3f4f6);
  border-radius: var(--cx-ui-select-tag-border-radius, 3px);
  font-size: 12px;
  line-height: 1;
  color: var(--cx-ui-select-tag-text-color, #1f2937);
  max-width: 100%;
  box-sizing: border-box;
}

.cx-ui-select__tag-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  color: var(--cx-ui-select-tag-close-color, #999);
  transition: color 0.2s, background 0.2s;
}

.cx-ui-select__tag-close:hover {
  color: var(--cx-ui-select-tag-close-color-hover, #333);
  background: var(--cx-ui-select-tag-close-bg-hover, rgba(0, 0, 0, 0.06));
}

/* ── virtual viewport ── */
.cx-ui-select__dropdown--virtual {
  overflow: hidden;
}

.cx-ui-select__viewport {
  position: relative;
  overflow-y: auto;
}

/* ── loading ── */
.cx-ui-select__loading {
  padding: 10px 12px;
  text-align: center;
  color: var(--cx-ui-select-loading-color, #bfbfbf);
  font-size: 14px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'select';

let injected = false;

export function ensureChronixSelectStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_SELECT_CSS;
  document.head.appendChild(style);
  injected = true;
}
