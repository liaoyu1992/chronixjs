/**
 * Grid stylesheet — Phase 17 (2026-06-02).
 *
 * Single-element CSS Grid container. Track template + column-gap +
 * row-gap come from inline `style` set by the adapter via
 * `resolveGridTracks` + `resolveGridGap`. The static stylesheet
 * only declares the `display` modifiers.
 */
export const CHRONIX_GRID_CSS = `
.cx-ui-grid {
  display: grid;
}

.cx-ui-grid--inline { display: inline-grid; }
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'grid';

let injected = false;

/**
 * Inject the Grid stylesheet into `document.head` exactly once.
 * Sticky-flag semantics.
 */
export function ensureChronixGridStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_GRID_CSS;
  document.head.appendChild(style);
  injected = true;
}
