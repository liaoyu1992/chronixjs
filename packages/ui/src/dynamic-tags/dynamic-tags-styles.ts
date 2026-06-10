export const CHRONIX_DYNAMIC_TAGS_CSS = `
.cx-ui-dynamic-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cx-ui-dynamic-tags-gap, 6px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-dynamic-tags--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cx-ui-dynamic-tags__tag {
  display: inline-flex;
  align-items: center;
  gap: var(--cx-ui-dynamic-tags-tag-gap, 4px);
  padding: 2px 8px;
  border-radius: var(--cx-ui-dynamic-tags-tag-radius, var(--cx-ui-border-radius, 3px));
  border: 1px solid var(--cx-ui-dynamic-tags-tag-border-color, #d1d5db);
  background: var(--cx-ui-dynamic-tags-tag-bg, #f3f4f6);
  color: var(--cx-ui-dynamic-tags-tag-text-color, #1f2937);
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
}

.cx-ui-dynamic-tags__close {
  cursor: pointer;
  border: 0;
  background: transparent;
  color: var(--cx-ui-dynamic-tags-close-color, #6b7280);
  font-size: 12px;
  padding: 0;
  line-height: 1;
}

.cx-ui-dynamic-tags__close:hover {
  color: var(--cx-ui-dynamic-tags-close-hover-color, #374151);
}

.cx-ui-dynamic-tags__input {
  border: 1px solid var(--cx-ui-dynamic-tags-border-color, #d1d5db);
  border-radius: var(--cx-ui-dynamic-tags-border-radius, var(--cx-ui-border-radius, 3px));
  padding: 2px 8px;
  height: 28px;
  font: inherit;
  font-size: 13px;
  color: var(--cx-ui-dynamic-tags-text-color, #1f2937);
  background: var(--cx-ui-dynamic-tags-bg, #fff);
  outline: none;
  flex: 1;
  min-width: 80px;
}

.cx-ui-dynamic-tags__input::placeholder {
  color: var(--cx-ui-dynamic-tags-placeholder-color, #9ca3af);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'dynamic-tags';

let injected = false;

export function ensureChronixDynamicTagsStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_DYNAMIC_TAGS_CSS;
  document.head.appendChild(style);
  injected = true;
}
