export const CHRONIX_INFINITE_SCROLL_CSS = `
.cx-ui-infinite-scroll {
  overflow-y: auto;
  position: relative;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-infinite-scroll__content {
  min-height: 100%;
}

.cx-ui-infinite-scroll__sentinel {
  width: 100%;
  height: 1px;
}

.cx-ui-infinite-scroll__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--cx-ui-infinite-scroll-loading-padding, 12px 0);
  color: var(--cx-ui-infinite-scroll-loading-color, #6b7280);
  font-size: var(--cx-ui-infinite-scroll-loading-font-size, 14px);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'infinite-scroll';

let injected = false;

export function ensureChronixInfiniteScrollStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_INFINITE_SCROLL_CSS;
  document.head.appendChild(style);
  injected = true;
}
