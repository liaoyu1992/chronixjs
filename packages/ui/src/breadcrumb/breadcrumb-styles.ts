/**
 * Breadcrumb stylesheet — .
 *
 * Layout: inline-flex row of items + separators. Items default to
 * muted color + non-decorative text; clickable items get a stronger
 * color + underline-on-hover; current item gets the strongest
 * (non-link) color. Separators are non-interactive (`aria-hidden`).
 *
 * Two-level fallback (`var(--cx-ui-breadcrumb-*, fallback)`) keeps
 * the surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_BREADCRUMB_CSS = `
.cx-ui-breadcrumb {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-breadcrumb-font-size, 14px);
  color: var(--cx-ui-breadcrumb-text-color, #6b7280);
  line-height: 1.5;
}

.cx-ui-breadcrumb__item {
  color: inherit;
  text-decoration: none;
  padding: 2px 4px;
  border-radius: 2px;
}

.cx-ui-breadcrumb__item--clickable {
  cursor: pointer;
  color: var(--cx-ui-breadcrumb-link-color, #4b5563);
}

.cx-ui-breadcrumb__item--clickable:hover {
  color: var(--cx-ui-breadcrumb-link-hover-color, #18a058);
  text-decoration: underline;
}

.cx-ui-breadcrumb__item--current {
  color: var(--cx-ui-breadcrumb-current-color, #1f2937);
  font-weight: var(--cx-ui-breadcrumb-current-font-weight, 500);
  cursor: default;
}

.cx-ui-breadcrumb__separator {
  color: var(--cx-ui-breadcrumb-separator-color, #9ca3af);
  user-select: none;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'breadcrumb';

let injected = false;

/**
 * Inject the Breadcrumb stylesheet into `document.head` exactly once.
 * Sticky-flag semantics — once injected (or detected) the flag stays
 * `true` even if the `<style>` element is later removed by the
 * consumer.
 */
export function ensureChronixBreadcrumbStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_BREADCRUMB_CSS;
  document.head.appendChild(style);
  injected = true;
}
