export const CHRONIX_IMAGE_CSS = `
.cx-ui-image {
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}

.cx-ui-image--previewable {
  cursor: zoom-in;
}

.cx-ui-image--failed {
  background: var(--cx-ui-image-failed-bg, #f3f4f6);
  color: var(--cx-ui-image-failed-color, #6b7280);
}

.cx-ui-image-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cx-ui-image-preview-bg, #000000);
}

.cx-ui-image-preview__img {
  max-width: 100%;
  max-height: 80vh;
  display: block;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'image';

let injected = false;

export function ensureChronixImageStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_IMAGE_CSS;
  document.head.appendChild(style);
  injected = true;
}
