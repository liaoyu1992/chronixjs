/**
 * TreeSelect CSS — Phase 31 (2026-06-04).
 */

export const CHRONIX_TREE_SELECT_CSS = `
.cx-ui-tree-select {
  position: relative;
  display: inline-flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  width: var(--cx-ui-tree-select-width, 240px);
}

.cx-ui-tree-select--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-tree-select--open .cx-ui-tree-select__dropdown {
  opacity: 1;
  pointer-events: auto;
}

.cx-ui-tree-select__trigger {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 28px 4px 10px;
  border: 1px solid var(--cx-ui-tree-select-border-color, #d9d9d9);
  border-radius: var(--cx-ui-tree-select-border-radius, var(--cx-ui-border-radius, 4px));
  background: var(--cx-ui-tree-select-bg, #fff);
  color: var(--cx-ui-tree-select-text-color, #1f2937);
  cursor: pointer;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.cx-ui-tree-select__trigger:hover {
  border-color: var(--cx-ui-tree-select-border-color-hover, #4096ff);
}

.cx-ui-tree-select__trigger--active {
  border-color: var(--cx-ui-tree-select-border-color-active, #4096ff);
  box-shadow: 0 0 0 2px var(--cx-ui-tree-select-outline-color, rgba(64, 150, 255, 0.2));
}

.cx-ui-tree-select__trigger--placeholder {
  color: var(--cx-ui-tree-select-placeholder-color, #bfbfbf);
}

.cx-ui-tree-select--multiple .cx-ui-tree-select__trigger {
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px 28px 2px 4px;
}

.cx-ui-tree-select__value-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cx-ui-tree-select__arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%) rotate(0deg);
  transition: transform 0.2s;
  pointer-events: none;
  font-size: 12px;
  color: var(--cx-ui-tree-select-arrow-color, #bfbfbf);
}

.cx-ui-tree-select__arrow--active {
  transform: translateY(-50%) rotate(180deg);
}

.cx-ui-tree-select__dropdown {
  position: fixed;
  background: var(--cx-ui-tree-select-dropdown-bg, #fff);
  color: var(--cx-ui-tree-select-text-color, #1f2937);
  border: 1px solid var(--cx-ui-tree-select-dropdown-border-color, #e5e7eb);
  border-radius: var(--cx-ui-tree-select-dropdown-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-tree-select-dropdown-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 4px 0;
  max-height: 300px;
  overflow-y: auto;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
  z-index: var(--cx-ui-tree-select-dropdown-z-index, 1050);
}

.cx-ui-tree-select__tree {
  padding: 0;
}

.cx-ui-tree-select__tree-row {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;
}

.cx-ui-tree-select__tree-row:hover {
  background: var(--cx-ui-tree-select-row-hover-bg, #f3f4f6);
}

.cx-ui-tree-select__tree-row--selected {
  background: var(--cx-ui-tree-select-row-selected-bg, rgba(64, 150, 255, 0.08));
  color: var(--cx-ui-tree-select-row-selected-color, #4096ff);
}

.cx-ui-tree-select__tree-row--focused:not(.cx-ui-tree-select__tree-row--disabled) {
  background: var(--cx-ui-tree-select-row-focus-bg, #f3f4f6);
}

.cx-ui-tree-select__tree-row--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cx-ui-tree-select__tree-row-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cx-ui-tree-select__tree-arrow {
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  transition: transform 0.15s;
  flex-shrink: 0;
}

.cx-ui-tree-select__tree-arrow--expanded {
  transform: rotate(90deg);
}

.cx-ui-tree-select__tree-arrow--hidden {
  visibility: hidden;
}

.cx-ui-tree-select__tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  height: 22px;
  background: var(--cx-ui-tree-select-tag-bg, #f3f4f6);
  border-radius: 3px;
  font-size: 12px;
  line-height: 1;
  color: var(--cx-ui-tree-select-tag-text-color, #1f2937);
}

.cx-ui-tree-select__tag-close {
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

.cx-ui-tree-select__tag-close:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.06);
}

.cx-ui-tree-select__empty {
  padding: 10px 12px;
  color: var(--cx-ui-tree-select-empty-color, #bfbfbf);
  text-align: center;
  font-size: 14px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'tree-select';

let injected = false;

export function ensureChronixTreeSelectStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TREE_SELECT_CSS;
  document.head.appendChild(style);
  injected = true;
}
