/**
 * Steps stylesheet — Phase 20 (2026-06-03).
 *
 * Horizontal layout: row of `(indicator + content) + separator`
 * groups; separators flex to fill space between indicators.
 * Vertical layout: column with separators as vertical lines below
 * each indicator. Per-status modifiers color the indicator ring +
 * separator + title independently so consumers can theme one axis
 * without touching another.
 *
 * Two-level fallback (`var(--cx-ui-steps-*, fallback)`) keeps the
 * surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_STEPS_CSS = `
.cx-ui-steps {
  display: flex;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-steps-font-size, 14px);
  color: var(--cx-ui-steps-text-color, #1f2937);
}

.cx-ui-steps--horizontal {
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
}

.cx-ui-steps--vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}

.cx-ui-steps__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 0 0 auto;
  min-width: 0;
}

.cx-ui-steps--horizontal .cx-ui-steps__item {
  flex-direction: row;
}

.cx-ui-steps--vertical .cx-ui-steps__item {
  flex-direction: row;
  align-items: flex-start;
}

.cx-ui-steps__indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--cx-ui-steps-indicator-size, 28px);
  height: var(--cx-ui-steps-indicator-size, 28px);
  border-radius: 50%;
  border: 1px solid var(--cx-ui-steps-indicator-border-color, #d1d5db);
  background: var(--cx-ui-steps-indicator-bg, #ffffff);
  flex: 0 0 auto;
}

.cx-ui-steps__index {
  font-weight: var(--cx-ui-steps-index-font-weight, 500);
  font-size: var(--cx-ui-steps-index-font-size, 13px);
  line-height: 1;
  color: inherit;
}

.cx-ui-steps__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cx-ui-steps__title {
  font-weight: var(--cx-ui-steps-title-font-weight, 500);
  color: var(--cx-ui-steps-title-color, #1f2937);
  line-height: 1.3;
}

.cx-ui-steps__description {
  color: var(--cx-ui-steps-description-color, #6b7280);
  font-size: var(--cx-ui-steps-description-font-size, 12px);
  line-height: 1.4;
}

.cx-ui-steps__separator {
  flex: 1 1 auto;
  align-self: center;
  background: var(--cx-ui-steps-separator-color, #e5e7eb);
}

.cx-ui-steps--horizontal .cx-ui-steps__separator {
  height: var(--cx-ui-steps-separator-thickness, 1px);
  min-width: 16px;
}

.cx-ui-steps--vertical .cx-ui-steps__separator {
  width: var(--cx-ui-steps-separator-thickness, 1px);
  min-height: 16px;
  margin-left: calc(var(--cx-ui-steps-indicator-size, 28px) / 2);
}

/* Status modifiers — color the indicator ring + title independently. */
.cx-ui-steps__item--wait .cx-ui-steps__indicator {
  border-color: var(--cx-ui-steps-indicator-border-color, #d1d5db);
  color: var(--cx-ui-steps-index-color-wait, #6b7280);
}

.cx-ui-steps__item--process .cx-ui-steps__indicator {
  border-color: var(--cx-ui-steps-indicator-border-color-process, #2080f0);
  background: var(--cx-ui-steps-indicator-bg-process, #2080f0);
  color: var(--cx-ui-steps-index-color-process, #ffffff);
}

.cx-ui-steps__item--process .cx-ui-steps__title {
  color: var(--cx-ui-steps-title-color-process, #2080f0);
}

.cx-ui-steps__item--finish .cx-ui-steps__indicator {
  border-color: var(--cx-ui-steps-indicator-border-color-finish, #18a058);
  background: var(--cx-ui-steps-indicator-bg-finish, #18a058);
  color: var(--cx-ui-steps-index-color-finish, #ffffff);
}

.cx-ui-steps__item--error .cx-ui-steps__indicator {
  border-color: var(--cx-ui-steps-indicator-border-color-error, #d03050);
  background: var(--cx-ui-steps-indicator-bg-error, #d03050);
  color: var(--cx-ui-steps-index-color-error, #ffffff);
}

.cx-ui-steps__item--error .cx-ui-steps__title {
  color: var(--cx-ui-steps-title-color-error, #d03050);
}

/* Has-error aggregate modifier — consumers can recolor separators. */
.cx-ui-steps--has-error .cx-ui-steps__separator {
  background: var(--cx-ui-steps-separator-color-has-error, #e5e7eb);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'steps';

let injected = false;

/**
 * Inject the Steps stylesheet into `document.head` exactly once.
 * Sticky-flag semantics — once injected (or detected) the flag
 * stays `true` even if the `<style>` element is later removed by
 * the consumer.
 */
export function ensureChronixStepsStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_STEPS_CSS;
  document.head.appendChild(style);
  injected = true;
}
