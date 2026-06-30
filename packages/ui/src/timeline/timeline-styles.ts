/**
 * Timeline stylesheet — .
 *
 * Vertical column of `(indicator + content)` rows. Indicator
 * contains a colored dot at top + a connecting line below; the line
 * is omitted on the last item via the `--last` modifier (DOM
 * removal — adapter never renders `__line` on the last item; the
 * class is for consumer-side styling hooks).
 *
 * Two-level fallback (`var(--cx-ui-timeline-*, fallback)`) keeps
 * the surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_TIMELINE_CSS = `
.cx-ui-timeline {
  display: flex;
  flex-direction: column;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-timeline-font-size, 14px);
  color: var(--cx-ui-timeline-text-color, #1f2937);
}

.cx-ui-timeline__item {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: stretch;
}

.cx-ui-timeline__indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  width: var(--cx-ui-timeline-indicator-width, 14px);
}

.cx-ui-timeline__dot {
  width: var(--cx-ui-timeline-dot-size, 10px);
  height: var(--cx-ui-timeline-dot-size, 10px);
  border-radius: 50%;
  background: var(--cx-ui-timeline-dot-color, #9ca3af);
  margin-top: 6px;
  flex: 0 0 auto;
}

.cx-ui-timeline__line {
  flex: 1 1 auto;
  width: var(--cx-ui-timeline-line-thickness, 1px);
  background: var(--cx-ui-timeline-line-color, #e5e7eb);
  margin-top: 4px;
  margin-bottom: 4px;
  min-height: 16px;
}

.cx-ui-timeline__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 12px;
  min-width: 0;
  flex: 1 1 auto;
}

.cx-ui-timeline__item--last .cx-ui-timeline__content {
  padding-bottom: 0;
}

.cx-ui-timeline__title {
  font-weight: var(--cx-ui-timeline-title-font-weight, 500);
  color: var(--cx-ui-timeline-title-color, #1f2937);
  line-height: 1.3;
}

.cx-ui-timeline__description {
  color: var(--cx-ui-timeline-description-color, #6b7280);
  line-height: 1.4;
}

.cx-ui-timeline__timestamp {
  color: var(--cx-ui-timeline-timestamp-color, #9ca3af);
  font-size: var(--cx-ui-timeline-timestamp-font-size, 12px);
  margin-top: 2px;
}

/* Color modifiers — dot color tokens. */
.cx-ui-timeline__item--color-default .cx-ui-timeline__dot {
  background: var(--cx-ui-timeline-dot-color, #9ca3af);
}
.cx-ui-timeline__item--color-success .cx-ui-timeline__dot {
  background: var(--cx-ui-timeline-dot-color-success, #18a058);
}
.cx-ui-timeline__item--color-warning .cx-ui-timeline__dot {
  background: var(--cx-ui-timeline-dot-color-warning, #f0a020);
}
.cx-ui-timeline__item--color-error .cx-ui-timeline__dot {
  background: var(--cx-ui-timeline-dot-color-error, #d03050);
}
.cx-ui-timeline__item--color-info .cx-ui-timeline__dot {
  background: var(--cx-ui-timeline-dot-color-info, #2080f0);
}

/* Line style modifiers — solid (default) vs dashed. The dashed
   style uses a repeating linear-gradient instead of border-style
   (the line is a colored block, not a bordered element). */
.cx-ui-timeline__item--line-default .cx-ui-timeline__line {
  background: var(--cx-ui-timeline-line-color, #e5e7eb);
}

.cx-ui-timeline__item--line-dashed .cx-ui-timeline__line {
  background: repeating-linear-gradient(
    to bottom,
    var(--cx-ui-timeline-line-color, #e5e7eb) 0 4px,
    transparent 4px 8px
  );
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'timeline';

let injected = false;

/**
 * Inject the Timeline stylesheet into `document.head` exactly once.
 * Sticky-flag semantics — once injected (or detected) the flag
 * stays `true` even if the `<style>` element is later removed.
 */
export function ensureChronixTimelineStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_TIMELINE_CSS;
  document.head.appendChild(style);
  injected = true;
}
