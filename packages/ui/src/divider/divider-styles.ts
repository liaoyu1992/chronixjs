/**
 * Divider stylesheet — Phase 13 (2026-06-02). Mirrors the Phase 11
 * Button + Phase 13 Tag styles hoist pattern: single CSS string in
 * core; all 3 adapters share. Tokens via CSS-var fallback.
 *
 * Layout strategy:
 *
 * - **Horizontal** dividers are flex containers. When there's no
 *   title, a single `::before` pseudo-element draws the full-width
 *   line. When there's a title, two flex-grow line segments wrap the
 *   `.cx-ui-divider__title` span; their grow ratios shift based on
 *   the `--title-{placement}` modifier.
 * - **Vertical** dividers are inline-block elements with a single
 *   vertical border on the left side.
 */
export const CHRONIX_DIVIDER_CSS = `
.cx-ui-divider {
  box-sizing: border-box;
  color: var(--cx-ui-divider-text-color, #6b7280);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-divider-font-size, 14px);
}

/* Horizontal — full-width line via flex layout */
.cx-ui-divider--horizontal {
  display: flex;
  align-items: center;
  width: 100%;
  margin: var(--cx-ui-divider-margin-block, 16px) 0;
}
.cx-ui-divider--horizontal::before,
.cx-ui-divider--horizontal::after {
  content: '';
  flex: 1 1 auto;
  height: 0;
  border-top: 1px solid var(--cx-ui-divider-color, #e5e7eb);
}
/* Hide the trailing pseudo-element when there's no title (single line) */
.cx-ui-divider--horizontal:not(.cx-ui-divider--with-title)::after {
  display: none;
}

/* With-title — both pseudo-elements visible; flex grow ratios drive placement */
.cx-ui-divider--with-title.cx-ui-divider--title-left::before {
  flex-grow: 0;
  flex-basis: var(--cx-ui-divider-title-inset, 24px);
}
.cx-ui-divider--with-title.cx-ui-divider--title-right::after {
  flex-grow: 0;
  flex-basis: var(--cx-ui-divider-title-inset, 24px);
}

/* Title label sits between the two line segments */
.cx-ui-divider__title {
  flex: 0 0 auto;
  padding: 0 var(--cx-ui-divider-title-padding, 16px);
  font-weight: var(--cx-ui-divider-title-font-weight, 500);
  color: var(--cx-ui-divider-title-color, #1f2937);
  white-space: nowrap;
}

/* Vertical — inline-block bar */
.cx-ui-divider--vertical {
  display: inline-block;
  width: 0;
  height: var(--cx-ui-divider-vertical-height, 1em);
  vertical-align: middle;
  margin: 0 var(--cx-ui-divider-margin-inline, 8px);
  border-left: 1px solid var(--cx-ui-divider-color, #e5e7eb);
}

/* Dashed modifier — propagates to all line drawing surfaces */
.cx-ui-divider--dashed.cx-ui-divider--horizontal::before,
.cx-ui-divider--dashed.cx-ui-divider--horizontal::after {
  border-top-style: dashed;
}
.cx-ui-divider--dashed.cx-ui-divider--vertical {
  border-left-style: dashed;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'divider';

let injected = false;

/**
 * Inject the Divider stylesheet into `document.head` exactly once
 * per browser document. Safe to call from any adapter; no-op on
 * subsequent calls and on the server (no `document`).
 */
export function ensureChronixDividerStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_DIVIDER_CSS;
  document.head.appendChild(style);
  injected = true;
}
