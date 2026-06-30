/**
 * Mention CSS — .
 */

export const CHRONIX_MENTION_CSS = `
.cx-ui-mention {
  position: relative;
  display: inline-flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  width: var(--cx-ui-mention-width, 300px);
}

.cx-ui-mention--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.cx-ui-mention--open .cx-ui-mention__dropdown {
  opacity: 1;
  pointer-events: auto;
}

.cx-ui-mention__textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px 10px;
  border: 1px solid var(--cx-ui-mention-border-color, #d9d9d9);
  border-radius: var(--cx-ui-mention-border-radius, var(--cx-ui-border-radius, 4px));
  background: var(--cx-ui-mention-bg, #fff);
  color: var(--cx-ui-mention-text-color, #1f2937);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}

.cx-ui-mention__textarea:focus {
  border-color: var(--cx-ui-mention-border-color-active, #4096ff);
  box-shadow: 0 0 0 2px var(--cx-ui-mention-outline-color, rgba(64, 150, 255, 0.2));
}

.cx-ui-mention__dropdown {
  position: fixed;
  background: var(--cx-ui-mention-dropdown-bg, #fff);
  color: var(--cx-ui-mention-text-color, #1f2937);
  border: 1px solid var(--cx-ui-mention-dropdown-border-color, #e5e7eb);
  border-radius: var(--cx-ui-mention-dropdown-border-radius, var(--cx-ui-border-radius, 4px));
  box-shadow: var(--cx-ui-mention-dropdown-shadow, 0 6px 16px rgba(0, 0, 0, 0.12));
  padding: 4px 0;
  max-height: 200px;
  overflow-y: auto;
  opacity: 0;
  transition: opacity 150ms ease-in-out;
  pointer-events: none;
  z-index: var(--cx-ui-mention-dropdown-z-index, 1050);
  min-width: 150px;
}

.cx-ui-mention__option {
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  line-height: 1.4;
}

.cx-ui-mention__option:hover {
  background: var(--cx-ui-mention-option-hover-bg, #f3f4f6);
}

.cx-ui-mention__option--focused {
  background: var(--cx-ui-mention-option-focus-bg, #f3f4f6);
}

.cx-ui-mention__option--selected {
  color: var(--cx-ui-mention-option-selected-color, #4096ff);
  font-weight: 500;
}

.cx-ui-mention__option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cx-ui-mention__empty {
  padding: 10px 12px;
  color: var(--cx-ui-mention-empty-color, #bfbfbf);
  text-align: center;
  font-size: 14px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'mention';

let injected = false;

export function ensureChronixMentionStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_MENTION_CSS;
  document.head.appendChild(style);
  injected = true;
}
