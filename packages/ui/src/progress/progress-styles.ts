/**
 * Progress stylesheet — Phase 16 (2026-06-02). Line variant only.
 *
 * Layout:
 *
 * - Root `.cx-ui-progress`: horizontal flex; gap between rail and
 *   outside-info element.
 * - `.cx-ui-progress__rail`: full-width grey track that contains the
 *   filled bar.
 * - `.cx-ui-progress__fill`: absolutely-positioned (within rail)
 *   bar; width is driven by inline `style="width: NN%"` set by the
 *   adapter from `formatProgressPercentage`. Per-type bg color via
 *   modifier classes + CSS-var fallback.
 * - `.cx-ui-progress__info`: percentage text. With
 *   `--info-outside` (default), renders as a sibling next to the
 *   rail; with `--info-inside`, overlays the fill at the right edge.
 *
 * Two-level fallback (`var(--cx-ui-progress-*, fallback)`) keeps the
 * bar visible without a `<ChronixUIProvider>`.
 */
export const CHRONIX_PROGRESS_CSS = `
.cx-ui-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--cx-ui-progress-text-color, #1f2937);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-progress-font-size, 13px);
  line-height: 1;
}

.cx-ui-progress__rail {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  height: var(--cx-ui-progress-rail-height, 8px);
  background-color: var(--cx-ui-progress-rail-color, #e5e7eb);
  border-radius: 999px;
  overflow: hidden;
}

.cx-ui-progress__fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background-color: var(--cx-ui-progress-fill-color, #18a058);
  border-radius: inherit;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Type modifiers — drive fill color */
.cx-ui-progress--default .cx-ui-progress__fill {
  background-color: var(--cx-ui-progress-fill-color, #18a058);
}
.cx-ui-progress--success .cx-ui-progress__fill {
  background-color: var(--cx-ui-progress-fill-color-success, #18a058);
}
.cx-ui-progress--warning .cx-ui-progress__fill {
  background-color: var(--cx-ui-progress-fill-color-warning, #f0a020);
}
.cx-ui-progress--error .cx-ui-progress__fill {
  background-color: var(--cx-ui-progress-fill-color-error, #d03050);
}
.cx-ui-progress--info .cx-ui-progress__fill {
  background-color: var(--cx-ui-progress-fill-color-info, #2080f0);
}

/* Info placement — outside (default) renders as sibling next to rail */
.cx-ui-progress--info-outside .cx-ui-progress__info {
  flex: 0 0 auto;
  min-width: 36px;
  text-align: right;
}

/* Info placement — inside overlays the fill at the right edge */
.cx-ui-progress--info-inside .cx-ui-progress__info {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--cx-ui-progress-text-color-inside, #ffffff);
  font-size: var(--cx-ui-progress-font-size-inside, 11px);
  z-index: 1;
}

.cx-ui-progress__info {
  white-space: nowrap;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'progress';

let injected = false;

/**
 * Inject the Progress stylesheet into `document.head` exactly once.
 * Sticky-flag semantics (see button/badge/empty for the same pattern).
 */
export function ensureChronixProgressStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_PROGRESS_CSS;
  document.head.appendChild(style);
  injected = true;
}
