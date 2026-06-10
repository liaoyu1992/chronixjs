export const CHRONIX_AVATAR_CSS = `
.cx-ui-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--cx-ui-avatar-bg, #e5e7eb);
  color: var(--cx-ui-avatar-text-color, #1f2937);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-weight: 600;
  user-select: none;
  vertical-align: middle;
}

.cx-ui-avatar--circle {
  border-radius: 50%;
}

.cx-ui-avatar--square {
  border-radius: 0;
}

.cx-ui-avatar--round {
  border-radius: var(--cx-ui-avatar-round-radius, 6px);
}

.cx-ui-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'avatar';

let injected = false;

export function ensureChronixAvatarStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_AVATAR_CSS;
  document.head.appendChild(style);
  injected = true;
}
