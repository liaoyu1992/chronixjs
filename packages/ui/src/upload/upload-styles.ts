export const CHRONIX_UPLOAD_CSS = `
.cx-ui-upload {
  display: inline-flex;
  flex-direction: column;
  gap: var(--cx-ui-upload-gap, 8px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-upload-font-size, 14px);
}

.cx-ui-upload__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--cx-ui-upload-trigger-padding, 6px 16px);
  background: var(--cx-ui-upload-trigger-bg, #3b82f6);
  color: var(--cx-ui-upload-trigger-color, #ffffff);
  border: none;
  border-radius: var(--cx-ui-upload-trigger-radius, 4px);
  cursor: pointer;
  font-size: inherit;
  transition: background 0.2s;
}

.cx-ui-upload__trigger:hover {
  background: var(--cx-ui-upload-trigger-hover-bg, #2563eb);
}

.cx-ui-upload--disabled .cx-ui-upload__trigger {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.cx-ui-upload__file-list {
  display: flex;
  flex-direction: column;
  gap: var(--cx-ui-upload-file-list-gap, 4px);
  list-style: none;
  margin: 0;
  padding: 0;
}

.cx-ui-upload-file {
  display: flex;
  align-items: center;
  gap: var(--cx-ui-upload-file-gap, 8px);
  padding: var(--cx-ui-upload-file-padding, 8px 12px);
  background: var(--cx-ui-upload-file-bg, #f9fafb);
  border: 1px solid var(--cx-ui-upload-file-border-color, #e5e7eb);
  border-radius: var(--cx-ui-upload-file-radius, 4px);
}

.cx-ui-upload-file__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--cx-ui-upload-file-name-color, #374151);
}

.cx-ui-upload-file__progress {
  height: var(--cx-ui-upload-file-progress-height, 4px);
  background: var(--cx-ui-upload-file-progress-bg, #e5e7eb);
  border-radius: 2px;
  overflow: hidden;
}

.cx-ui-upload-file__progress-bar {
  height: 100%;
  background: var(--cx-ui-upload-file-progress-bar-bg, #3b82f6);
  transition: width 0.2s;
}

.cx-ui-upload-file--pending {
  opacity: 0.7;
}

.cx-ui-upload-file--uploading .cx-ui-upload-file__progress-bar {
  background: var(--cx-ui-upload-file-progress-bar-bg, #3b82f6);
}

.cx-ui-upload-file--finished {
  border-color: var(--cx-ui-upload-file-finished-border, #10b981);
}

.cx-ui-upload-file--finished .cx-ui-upload-file__progress-bar {
  background: var(--cx-ui-upload-file-finished-color, #10b981);
}

.cx-ui-upload-file--error {
  border-color: var(--cx-ui-upload-file-error-border, #ef4444);
}

.cx-ui-upload-file--error .cx-ui-upload-file__progress-bar {
  background: var(--cx-ui-upload-file-error-color, #ef4444);
}

.cx-ui-upload-file--removed {
  display: none;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'upload';

let injected = false;

export function ensureChronixUploadStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_UPLOAD_CSS;
  document.head.appendChild(style);
  injected = true;
}
