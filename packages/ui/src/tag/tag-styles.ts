/**
 * Tag stylesheet — Phase 13 (2026-06-02). Mirrors the Phase 11
 * Button styles hoist (`packages/ui/src/button/button-styles.ts`):
 * single source of CSS shared by all 3 adapters; per-instance theming
 * comes from `--cx-ui-*` CSS custom properties on the
 * `<ChronixUIProvider>` root.
 *
 * Two-level fallback (`var(--cx-ui-tag-{type}-bg, fallback)`) keeps
 * tags readable even when no `<ChronixUIProvider>` is mounted (raw
 * usage in plain HTML).
 */
export const CHRONIX_TAG_CSS = `
.cx-ui-tag {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: var(--cx-ui-tag-border-radius, 3px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-weight: var(--cx-ui-tag-font-weight, 400);
  line-height: 1;
  white-space: nowrap;
  user-select: none;
}

/* Size modifiers */
.cx-ui-tag--small {
  height: var(--cx-ui-tag-height-small, 20px);
  padding: 0 var(--cx-ui-tag-padding-x-small, 6px);
  font-size: var(--cx-ui-font-size-small, 12px);
}
.cx-ui-tag--medium {
  height: var(--cx-ui-tag-height-medium, 24px);
  padding: 0 var(--cx-ui-tag-padding-x, 8px);
  font-size: var(--cx-ui-font-size, 14px);
}
.cx-ui-tag--large {
  height: var(--cx-ui-tag-height-large, 30px);
  padding: 0 var(--cx-ui-tag-padding-x-large, 12px);
  font-size: var(--cx-ui-font-size-large, 16px);
}

/* Round modifier — full-pill radius */
.cx-ui-tag--round {
  border-radius: 999px;
}

/* Type variants — bg + text + border colors */
.cx-ui-tag--default {
  background-color: var(--cx-ui-tag-bg-color, #f5f6f7);
  color: var(--cx-ui-tag-text-color, #1f2937);
}
.cx-ui-tag--primary {
  background-color: var(--cx-ui-tag-bg-color-primary, rgba(24, 160, 88, 0.12));
  color: var(--cx-ui-tag-text-color-primary, #18a058);
}
.cx-ui-tag--info {
  background-color: var(--cx-ui-tag-bg-color-info, rgba(32, 128, 240, 0.12));
  color: var(--cx-ui-tag-text-color-info, #2080f0);
}
.cx-ui-tag--success {
  background-color: var(--cx-ui-tag-bg-color-success, rgba(24, 160, 88, 0.12));
  color: var(--cx-ui-tag-text-color-success, #18a058);
}
.cx-ui-tag--warning {
  background-color: var(--cx-ui-tag-bg-color-warning, rgba(240, 160, 32, 0.12));
  color: var(--cx-ui-tag-text-color-warning, #f0a020);
}
.cx-ui-tag--error {
  background-color: var(--cx-ui-tag-bg-color-error, rgba(208, 48, 80, 0.12));
  color: var(--cx-ui-tag-text-color-error, #d03050);
}

/* Bordered modifier — adds visible border in the matching type color */
.cx-ui-tag--bordered.cx-ui-tag--default {
  border-color: var(--cx-ui-tag-border-color, #e5e7eb);
}
.cx-ui-tag--bordered.cx-ui-tag--primary {
  border-color: var(--cx-ui-tag-text-color-primary, #18a058);
}
.cx-ui-tag--bordered.cx-ui-tag--info {
  border-color: var(--cx-ui-tag-text-color-info, #2080f0);
}
.cx-ui-tag--bordered.cx-ui-tag--success {
  border-color: var(--cx-ui-tag-text-color-success, #18a058);
}
.cx-ui-tag--bordered.cx-ui-tag--warning {
  border-color: var(--cx-ui-tag-text-color-warning, #f0a020);
}
.cx-ui-tag--bordered.cx-ui-tag--error {
  border-color: var(--cx-ui-tag-text-color-error, #d03050);
}

/* Closable modifier — reserve padding for the close button */
.cx-ui-tag--closable {
  padding-right: var(--cx-ui-tag-padding-close, 4px);
}

/* Disabled state — applies regardless of type; wins over hover */
.cx-ui-tag--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Close button */
.cx-ui-tag__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  width: 14px;
  height: 14px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  border-radius: 2px;
  opacity: 0.6;
}
.cx-ui-tag__close:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.08);
}
.cx-ui-tag--disabled .cx-ui-tag__close {
  cursor: not-allowed;
  pointer-events: none;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'tag';

let injected = false;

/**
 * Inject the Tag stylesheet into `document.head` exactly once per
 * browser document. Safe to call from any adapter component setup —
 * no-op on subsequent calls and on the server (no `document`).
 *
 * The injected `<style>` element carries `data-chronix-ui="tag"` so
 * tests + devtools can identify chronix-ui-managed styles. The DOM
 * lookup before `appendChild` defends against duplicated workspace
 * deps.
 */
export function ensureChronixTagStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TAG_CSS;
  document.head.appendChild(style);
  injected = true;
}
