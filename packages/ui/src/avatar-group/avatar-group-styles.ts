export const CHRONIX_AVATAR_GROUP_CSS = `
.cx-ui-avatar-group {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
}

.cx-ui-avatar-group .cx-ui-avatar:not(:first-child) {
  margin-left: var(--cx-ui-avatar-group-overlap, -8px);
}

.cx-ui-avatar-group .cx-ui-avatar {
  border: 2px solid var(--cx-ui-avatar-group-ring-color, #ffffff);
  box-sizing: content-box;
}

.cx-ui-avatar-group__overflow {
  background: var(--cx-ui-avatar-group-overflow-bg, #9ca3af);
  color: var(--cx-ui-avatar-group-overflow-color, #ffffff);
  font-weight: 600;
  font-size: 12px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'avatar-group';

let injected = false;

export function ensureChronixAvatarGroupStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_AVATAR_GROUP_CSS;
  document.head.appendChild(style);
  injected = true;
}
