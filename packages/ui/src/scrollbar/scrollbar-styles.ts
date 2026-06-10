export const CHRONIX_SCROLLBAR_CSS = `
.cx-ui-scrollbar {
  overflow: hidden;
  position: relative;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-scrollbar__container {
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  width: 100%;
}

.cx-ui-scrollbar__container--x-scrollable {
  overflow-x: auto;
}

.cx-ui-scrollbar__rail {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: var(--cx-ui-scrollbar-rail-width, 8px);
  background: var(--cx-ui-scrollbar-rail-bg, transparent);
  border-radius: var(--cx-ui-scrollbar-rail-radius, 4px);
  transition: background 0.2s;
}

.cx-ui-scrollbar__rail--x {
  right: auto;
  bottom: 0;
  top: auto;
  left: 0;
  width: 100%;
  height: var(--cx-ui-scrollbar-rail-width, 8px);
}

.cx-ui-scrollbar__thumb {
  position: absolute;
  right: 0;
  width: var(--cx-ui-scrollbar-thumb-width, 6px);
  min-height: var(--cx-ui-scrollbar-thumb-min-height, 24px);
  background: var(--cx-ui-scrollbar-thumb-bg, rgba(0, 0, 0, 0.25));
  border-radius: var(--cx-ui-scrollbar-thumb-radius, 3px);
  transition: background 0.2s, opacity 0.2s;
}

.cx-ui-scrollbar__thumb:hover {
  background: var(--cx-ui-scrollbar-thumb-hover-bg, rgba(0, 0, 0, 0.4));
}

.cx-ui-scrollbar--hover .cx-ui-scrollbar__thumb {
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.cx-ui-scrollbar--hover:hover .cx-ui-scrollbar__thumb,
.cx-ui-scrollbar--hover:active .cx-ui-scrollbar__thumb {
  opacity: 1;
}

.cx-ui-scrollbar--none .cx-ui-scrollbar__rail {
  display: none;
}

.cx-ui-scrollbar--none .cx-ui-scrollbar__thumb {
  display: none;
}

/* Webkit scrollbar styling fallback */
.cx-ui-scrollbar__container::-webkit-scrollbar {
  width: var(--cx-ui-scrollbar-rail-width, 8px);
}

.cx-ui-scrollbar__container::-webkit-scrollbar-thumb {
  background: var(--cx-ui-scrollbar-thumb-bg, rgba(0, 0, 0, 0.25));
  border-radius: var(--cx-ui-scrollbar-thumb-radius, 3px);
}

.cx-ui-scrollbar__container::-webkit-scrollbar-thumb:hover {
  background: var(--cx-ui-scrollbar-thumb-hover-bg, rgba(0, 0, 0, 0.4));
}

.cx-ui-scrollbar__container::-webkit-scrollbar-track {
  background: var(--cx-ui-scrollbar-rail-bg, transparent);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'scrollbar';

let injected = false;

export function ensureChronixScrollbarStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_SCROLLBAR_CSS;
  document.head.appendChild(style);
  injected = true;
}
