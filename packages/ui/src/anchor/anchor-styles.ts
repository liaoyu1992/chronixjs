export const CHRONIX_ANCHOR_CSS = `
.cx-ui-anchor {
  display: flex;
  flex-direction: column;
  gap: var(--cx-ui-anchor-gap, 4px);
  padding: var(--cx-ui-anchor-padding, 8px 0);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-anchor-font-size, 14px);
  line-height: var(--cx-ui-anchor-line-height, 1.6);
  position: relative;
}

.cx-ui-anchor__link {
  display: block;
  padding: var(--cx-ui-anchor-link-padding, 4px 12px);
  color: var(--cx-ui-anchor-link-color, #6b7280);
  text-decoration: none;
  border-left: var(--cx-ui-anchor-link-border, 2px solid transparent);
  transition: color 0.2s, border-color 0.2s;
}

.cx-ui-anchor__link:hover {
  color: var(--cx-ui-anchor-link-hover-color, #374151);
}

.cx-ui-anchor__link--active {
  color: var(--cx-ui-anchor-link-active-color, #111827);
  border-left-color: var(--cx-ui-anchor-active-indicator, #3b82f6);
  font-weight: 500;
}

.cx-ui-anchor--show-rail {
  border-left: var(--cx-ui-anchor-rail-width, 2px) solid var(--cx-ui-anchor-rail-color, #e5e7eb);
}

.cx-ui-anchor--show-rail .cx-ui-anchor__link {
  border-left: none;
  padding-left: var(--cx-ui-anchor-link-padding-left, 12px);
}

.cx-ui-anchor--show-background {
  background: var(--cx-ui-anchor-bg, transparent);
  border-radius: var(--cx-ui-anchor-radius, 4px);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'anchor';

let injected = false;

export function ensureChronixAnchorStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_ANCHOR_CSS;
  document.head.appendChild(style);
  injected = true;
}
