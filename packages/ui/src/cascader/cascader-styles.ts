/**
 * Cascader CSS — Phase 31 (2026-06-04).
 */

export const CHRONIX_CASCADER_CSS = `
.cx-ui-cascader {
  position: relative;
  display: inline-flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  width: var(--cx-ui-cascader-width, 200px);
}

.cx-ui-cascader--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-cascader--open .cx-ui-cascader__dropdown {
  opacity: 1;
  pointer-events: auto;
}

.cx-ui-cascader__trigger {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 28px 4px 10px;
  border: 1px solid var(--cx-ui-cascader-border-color, #d9d9d9);
  border-radius: var(--cx-ui-cascader-border-radius, var(--cx-ui-border-radius, 4px));
  background: var(--cx-ui-cascader-bg, #fff);
  color: var(--cx-ui-cascader-text-color, #1f2937);
  cursor: pointer;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.cx-ui-cascader__trigger:hover {
  border-color: var(--cx-ui-cascader-border-color-hover, #4096ff);
}

.cx-ui-cascader__trigger--active {
  border-color: var(--cx-ui-cascader-border-color-active, #4096ff);
  box-shadow: 0 0 0 2px var(--cx-ui-cascader-outline-color, rgba(64, 150, 255, 0.2));
}

.cx-ui-cascader__trigger--placeholder {
  color: var(--cx-ui-cascader-placeholder-color, #bfbfbf);
}

.cx-ui-cascader--multiple .cx-ui-cascader__trigger {
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px 28px 2px 4px;
}

.cx-ui-cascader__value-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cx-ui-cascader__arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%) rotate(0deg);
  transition: transform 0.2s;
  pointer-events: none;
  font-size: 12px;
  color: var(--cx-ui-cascader-arrow-color, #bfbfbf);
}

.cx-ui-cascader__arrow--active {
  transform: translateY(-50%) rotate(180deg);
}

.cx-ui-cascader__dropdown {
  position: fixed;
  background: var(--cx-ui-cascader-dropdown-bg, #fff);
  color: var(--cx-ui-cascader-text-color, #1f2937);
  border: 1px solid var(--cx-ui-cascader-dropdown-border-color, #e5e7eb);
  border-radius: var(--cx-ui-cascader-dropdown-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-cascader-dropdown-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 4px 0;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
  z-index: var(--cx-ui-cascader-dropdown-z-index, 1050);
  display: flex;
}

.cx-ui-cascader__panel {
  min-width: 120px;
  max-height: 256px;
  overflow-y: auto;
  border-right: 1px solid var(--cx-ui-cascader-panel-border-color, #f0f0f0);
}

.cx-ui-cascader__panel:last-child {
  border-right: none;
}

.cx-ui-cascader__option {
  padding: 6px 24px 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
}

.cx-ui-cascader__option:hover {
  background: var(--cx-ui-cascader-option-hover-bg, #f3f4f6);
}

.cx-ui-cascader__option--active {
  background: var(--cx-ui-cascader-option-active-bg, #f3f4f6);
}

.cx-ui-cascader__option--selected {
  color: var(--cx-ui-cascader-option-selected-color, #4096ff);
  font-weight: 500;
}

.cx-ui-cascader__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cx-ui-cascader__option-arrow {
  font-size: 10px;
  color: var(--cx-ui-cascader-option-arrow-color, #bfbfbf);
  margin-left: 8px;
}

.cx-ui-cascader__empty {
  padding: 10px 12px;
  color: var(--cx-ui-cascader-empty-color, #bfbfbf);
  text-align: center;
  font-size: 14px;
}

.cx-ui-cascader__tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  height: 22px;
  background: var(--cx-ui-cascader-tag-bg, #f3f4f6);
  border-radius: 3px;
  font-size: 12px;
  line-height: 1;
  color: var(--cx-ui-cascader-tag-text-color, #1f2937);
}

.cx-ui-cascader__tag-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  color: #999;
}

.cx-ui-cascader__tag-close:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.06);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'cascader';

let injected = false;

export function ensureChronixCascaderStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_CASCADER_CSS;
  document.head.appendChild(style);
  injected = true;
}
