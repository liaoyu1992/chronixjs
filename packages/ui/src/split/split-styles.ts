export const CHRONIX_SPLIT_CSS = `
.cx-ui-split {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.cx-ui-split--direction-horizontal {
  flex-direction: row;
}

.cx-ui-split--direction-vertical {
  flex-direction: column;
}

.cx-ui-split--disabled .cx-ui-split__bar {
  pointer-events: none;
  cursor: default;
}

.cx-ui-split__pane {
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.cx-ui-split__pane--first {
  /* flex-basis applied via inline style */
}

.cx-ui-split__pane--second {
  flex: 1 1 0;
}

.cx-ui-split__bar {
  flex: 0 0 auto;
  background: var(--cx-ui-split-bar-bg, #d1d5db);
  position: relative;
  user-select: none;
  touch-action: none;
}

.cx-ui-split--direction-horizontal .cx-ui-split__bar {
  width: 6px;
  cursor: col-resize;
}

.cx-ui-split--direction-vertical .cx-ui-split__bar {
  height: 6px;
  cursor: row-resize;
}

.cx-ui-split__bar:hover {
  background: var(--cx-ui-split-bar-hover-bg, #9ca3af);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'split';

let injected = false;

export function ensureChronixSplitStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_SPLIT_CSS;
  document.head.appendChild(style);
  injected = true;
}
