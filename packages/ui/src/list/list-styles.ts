/**
 * List stylesheet — .
 *
 * Vertical sequence of `(prefix + main + suffix)` rows. The root
 * element is `<ul>` — the chronix-NEW friction note
 * applies: `<ul>` carries a user-agent CSS default
 * (`padding-inline-start: 40px; list-style-type: disc`) that
 * MUST be reset explicitly here, otherwise the rendered list
 * shows a dotted left margin inconsistently across browsers.
 *
 * Size modifiers (`--small / --medium / --large`) scale per-item
 * vertical padding. `--bordered` adds a 1px outer border;
 * `--hoverable` adds a hover-bg token; `--with-divider` adds a
 * 1px bottom line on every item except the last.
 *
 * Item modifiers (`--with-prefix / --with-suffix /
 * --with-description`) reflect which optional content fields the
 * item provides — they let consumer-side CSS adjust layout
 * proportions without re-rendering the item shape (e.g. dedicate
 * extra space to the main block when there's no prefix).
 *
 * Two-level fallback (`var(--cx-ui-list-*, fallback)`) keeps the
 * surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_LIST_CSS = `
.cx-ui-list {
  /* <ul> user-agent reset — friction note. */
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  flex-direction: column;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-list-font-size, 14px);
  color: var(--cx-ui-list-text-color, #1f2937);
}

.cx-ui-list__item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--cx-ui-list-item-gap, 12px);
  padding: var(--cx-ui-list-item-padding, 10px 12px);
  min-width: 0;
}

.cx-ui-list__prefix {
  flex: 0 0 auto;
  width: var(--cx-ui-list-prefix-size, 24px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--cx-ui-list-prefix-color, #6b7280);
  font-size: var(--cx-ui-list-prefix-font-size, 16px);
}

.cx-ui-list__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cx-ui-list__title {
  font-weight: var(--cx-ui-list-title-font-weight, 500);
  color: var(--cx-ui-list-title-color, #1f2937);
  line-height: 1.3;
}

.cx-ui-list__description {
  color: var(--cx-ui-list-description-color, #6b7280);
  font-size: var(--cx-ui-list-description-font-size, 12px);
  line-height: 1.4;
}

.cx-ui-list__suffix {
  flex: 0 0 auto;
  color: var(--cx-ui-list-suffix-color, #6b7280);
  font-size: var(--cx-ui-list-suffix-font-size, 13px);
}

/* Size modifiers — per-item padding scale. */
.cx-ui-list--small .cx-ui-list__item {
  padding: var(--cx-ui-list-item-padding-small, 6px 10px);
}

.cx-ui-list--medium .cx-ui-list__item {
  padding: var(--cx-ui-list-item-padding-medium, 10px 12px);
}

.cx-ui-list--large .cx-ui-list__item {
  padding: var(--cx-ui-list-item-padding-large, 14px 16px);
}

/* Bordered modifier — 1px outer border + border radius. */
.cx-ui-list--bordered {
  border: 1px solid var(--cx-ui-list-border-color, #e5e7eb);
  border-radius: var(--cx-ui-list-border-radius, 4px);
  overflow: hidden;
}

/* Hoverable modifier — hover bg on each item. */
.cx-ui-list--hoverable .cx-ui-list__item:hover {
  background: var(--cx-ui-list-item-hover-bg, #f3f4f6);
  cursor: pointer;
}

/* Divider modifier — 1px bottom border on every item except last. */
.cx-ui-list--with-divider .cx-ui-list__item:not(:last-child) {
  border-bottom: 1px solid var(--cx-ui-list-divider-color, #e5e7eb);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'list';

let injected = false;

/**
 * Inject the List stylesheet into `document.head` exactly once.
 * Sticky-flag semantics — once injected (or detected) the flag
 * stays `true` even if the `<style>` element is later removed by
 * the consumer.
 */
export function ensureChronixListStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_LIST_CSS;
  document.head.appendChild(style);
  injected = true;
}
