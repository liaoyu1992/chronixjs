/**
 * Thing stylesheet — .
 *
 * Root flex-row layout: optional `__avatar` (flex-shrink: 0) +
 * `__main` (flex-grow: 1) column. The main column stacks:
 * `__header` (flex-row with `__header-content` + `__header-extra`
 * justified to opposite ends) → `__description` → `__content` →
 * `__action` → `__footer`.
 *
 * The `--content-indented` modifier adds a leading margin to
 * `__content` matching the avatar width + gap so that the body
 * visually aligns with the header text rather than starting at
 * the avatar edge. Useful for chat / comment thread layouts.
 *
 * Two-level fallback (`var(--cx-ui-thing-*, fallback)`) keeps the
 * surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_THING_CSS = `
.cx-ui-thing {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: var(--cx-ui-thing-avatar-gap, 12px);
  padding: var(--cx-ui-thing-padding, 12px 16px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-thing-font-size, 14px);
  color: var(--cx-ui-thing-text-color, #1f2937);
}

.cx-ui-thing__avatar {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cx-ui-thing__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--cx-ui-thing-main-gap, 6px);
}

.cx-ui-thing__header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cx-ui-thing__header-content {
  font-weight: var(--cx-ui-thing-header-font-weight, 600);
  font-size: var(--cx-ui-thing-header-font-size, 15px);
  color: var(--cx-ui-thing-header-color, #1f2937);
  line-height: 1.3;
  flex: 1 1 auto;
  min-width: 0;
}

.cx-ui-thing__header-extra {
  flex: 0 0 auto;
  color: var(--cx-ui-thing-header-extra-color, #6b7280);
  font-size: var(--cx-ui-thing-header-extra-font-size, 12px);
}

.cx-ui-thing__description {
  color: var(--cx-ui-thing-description-color, #6b7280);
  font-size: var(--cx-ui-thing-description-font-size, 13px);
  line-height: 1.4;
}

.cx-ui-thing__content {
  color: var(--cx-ui-thing-content-color, #374151);
  line-height: 1.5;
}

.cx-ui-thing__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.cx-ui-thing__footer {
  border-top: 1px dashed var(--cx-ui-thing-footer-border-color, transparent);
  padding-top: 4px;
  color: var(--cx-ui-thing-footer-color, #6b7280);
  font-size: var(--cx-ui-thing-footer-font-size, 12px);
}

/* When content is indented, push it past the avatar column. */
.cx-ui-thing--content-indented.cx-ui-thing--with-avatar .cx-ui-thing__content,
.cx-ui-thing--content-indented.cx-ui-thing--with-avatar .cx-ui-thing__action,
.cx-ui-thing--content-indented.cx-ui-thing--with-avatar .cx-ui-thing__footer {
  margin-left: var(--cx-ui-thing-content-indent, 4px);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'thing';

let injected = false;

/**
 * Inject the Thing stylesheet into `document.head` exactly once.
 * Sticky-flag semantics — once injected (or detected) the flag
 * stays `true` even if the `<style>` element is later removed by
 * the consumer.
 */
export function ensureChronixThingStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_THING_CSS;
  document.head.appendChild(style);
  injected = true;
}
