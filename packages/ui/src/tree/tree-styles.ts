export const CHRONIX_TREE_CSS = `
.cx-ui-tree {
  display: block;
  font-size: 14px;
  line-height: 1.5;
  color: var(--cx-ui-tree-text-color, #1f2937);
}

.cx-ui-tree--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-tree__viewport {
  overflow-y: auto;
}

.cx-ui-tree--virtual .cx-ui-tree__viewport {
  position: relative;
  overflow-y: auto;
}

.cx-ui-tree__row {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 4px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  border-radius: 3px;
}

.cx-ui-tree__row:hover {
  background: var(--cx-ui-tree-row-hover-bg, rgba(0, 0, 0, 0.04));
}

.cx-ui-tree__row--selected {
  background: var(--cx-ui-tree-row-selected-bg, rgba(37, 99, 235, 0.08));
  color: var(--cx-ui-tree-row-selected-color, #2563eb);
}

.cx-ui-tree__row--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.cx-ui-tree__row--loading {
  opacity: 0.6;
}

.cx-ui-tree__indent {
  flex-shrink: 0;
}

.cx-ui-tree__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  color: var(--cx-ui-tree-arrow-color, #6b7280);
  font-size: 10px;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.cx-ui-tree__arrow--expanded {
  transform: rotate(90deg);
}

.cx-ui-tree__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 4px;
}

.cx-ui-tree__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cx-ui-tree__loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--cx-ui-tree-spinner-border, #d1d5db);
  border-top-color: var(--cx-ui-tree-spinner-active, #2563eb);
  border-radius: 50%;
  margin-left: 4px;
  animation: cx-ui-tree-spin 600ms linear infinite;
}

@keyframes cx-ui-tree-spin {
  to { transform: rotate(360deg); }
}

.cx-ui-tree__drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--cx-ui-tree-drop-color, #2563eb);
  pointer-events: none;
  z-index: 1;
}

.cx-ui-tree__drop-indicator--before {
  top: 0;
}

.cx-ui-tree__drop-indicator--inside {
  height: 100%;
  opacity: 0.12;
}

.cx-ui-tree__drop-indicator--after {
  bottom: 0;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'tree';

let injected = false;

export function ensureChronixTreeStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TREE_CSS;
  document.head.appendChild(style);
  injected = true;
}
