/**
 * Log stylesheet — Phase 23 (2026-06-03).
 *
 * Root `<div>` is the terminal-style container (dark background,
 * monospace, optional `max-height` from adapter inline style).
 * The lines container is `<ol>` — Phase 21 21-fr2 sibling for
 * `<ol>` UA reset applies (`padding-inline-start: 40px;
 * list-style-type: decimal` defaults must be reset).
 *
 * Per-line `<li>` is a flex-row with the optional `__line-number`
 * (rendered as DOM text per D.1) followed by `__line-content`.
 * `white-space: pre` preserves console output by default; the
 * `--wrap-lines` modifier flips to `pre-wrap; word-break:
 * break-word` for long-line wrapping.
 *
 * Two-level fallback (`var(--cx-ui-log-*, fallback)`) keeps the
 * surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_LOG_CSS = `
.cx-ui-log {
  display: block;
  font-family: var(--cx-ui-log-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: var(--cx-ui-log-font-size, 13px);
  line-height: 1.5;
  background: var(--cx-ui-log-bg, #1f2937);
  color: var(--cx-ui-log-text-color, #f9fafb);
  border-radius: var(--cx-ui-log-border-radius, 4px);
  border: 1px solid var(--cx-ui-log-border-color, #374151);
  padding: var(--cx-ui-log-padding, 8px 0);
}

.cx-ui-log__lines {
  /* <ol> user-agent reset — Phase 21 21-fr2 sibling for <ol>. */
  list-style: none;
  margin: 0;
  padding: 0;
}

.cx-ui-log__line {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
  padding: 0 12px;
  white-space: pre;
}

.cx-ui-log__line-number {
  flex: 0 0 auto;
  min-width: 3ch;
  text-align: right;
  opacity: 0.55;
  color: var(--cx-ui-log-line-number-color, #9ca3af);
  user-select: none;
}

.cx-ui-log__line-content {
  flex: 1 1 auto;
  min-width: 0;
}

.cx-ui-log--wrap-lines .cx-ui-log__line {
  white-space: pre-wrap;
  word-break: break-word;
}

.cx-ui-log--with-line-numbers .cx-ui-log__line {
  padding-left: 12px;
}

.cx-ui-log__loading {
  padding: 4px 12px;
  color: var(--cx-ui-log-loading-color, #9ca3af);
  font-style: italic;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'log';

let injected = false;

/**
 * Inject the Log stylesheet into `document.head` exactly once.
 * Sticky-flag semantics — once injected (or detected) the flag
 * stays `true` even if the `<style>` element is later removed by
 * the consumer.
 */
export function ensureChronixLogStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_LOG_CSS;
  document.head.appendChild(style);
  injected = true;
}
