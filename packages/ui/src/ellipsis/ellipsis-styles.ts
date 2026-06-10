/**
 * Ellipsis stylesheet — Phase 23 (2026-06-03).
 *
 * Root `<span>` declares `display: inline-block; max-width: 100%`
 * so the truncation has a bounded measurement context within
 * inline flows. The `--lines-1` modifier emits the single-line
 * three-piece (`white-space: nowrap; overflow: hidden;
 * text-overflow: ellipsis`); `--lines-{2..5}` emit the multi-line
 * four-piece (`display: -webkit-box; -webkit-line-clamp: N;
 * -webkit-box-orient: vertical; overflow: hidden`).
 *
 * The two strategies are mutually exclusive — `white-space:
 * nowrap` from the single-line rule conflicts with the multi-line
 * `-webkit-box` display. The class-list helper emits exactly one
 * `--lines-{N}` modifier per render (23-fr1).
 *
 * The `--with-tooltip` modifier adds `cursor: help` so consumers
 * with the native HTML `title` attribute also get the cursor
 * affordance. The dotted-underline style defaults to transparent
 * so it doesn't show without consumer opt-in.
 *
 * Two-level fallback (`var(--cx-ui-ellipsis-*, fallback)`) keeps
 * the surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_ELLIPSIS_CSS = `
.cx-ui-ellipsis {
  display: inline-block;
  max-width: 100%;
  vertical-align: bottom;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  color: var(--cx-ui-ellipsis-text-color, inherit);
}

.cx-ui-ellipsis--lines-1 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cx-ui-ellipsis--lines-2,
.cx-ui-ellipsis--lines-3,
.cx-ui-ellipsis--lines-4,
.cx-ui-ellipsis--lines-5 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.cx-ui-ellipsis--lines-2 {
  -webkit-line-clamp: 2;
}

.cx-ui-ellipsis--lines-3 {
  -webkit-line-clamp: 3;
}

.cx-ui-ellipsis--lines-4 {
  -webkit-line-clamp: 4;
}

.cx-ui-ellipsis--lines-5 {
  -webkit-line-clamp: 5;
}

.cx-ui-ellipsis--with-tooltip {
  cursor: help;
  text-decoration: underline dotted var(--cx-ui-ellipsis-tooltip-underline-color, transparent);
  text-underline-offset: 2px;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'ellipsis';

let injected = false;

/**
 * Inject the Ellipsis stylesheet into `document.head` exactly
 * once. Sticky-flag semantics — once injected (or detected) the
 * flag stays `true` even if the `<style>` element is later
 * removed by the consumer.
 */
export function ensureChronixEllipsisStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_ELLIPSIS_CSS;
  document.head.appendChild(style);
  injected = true;
}
