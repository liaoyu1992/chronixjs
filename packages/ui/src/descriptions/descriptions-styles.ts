/**
 * Descriptions stylesheet — .
 *
 * Multi-column key-value grid layout. The root `<div>` carries
 * the size + placement + bordered + with-title modifiers; the
 * `__grid` child carries the `grid-template-columns:
 * repeat(N, minmax(0, 1fr))` inline style produced by
 * `resolveDescriptionsGridTemplateColumns(columns)`. Each
 * `__item` may carry an inline `grid-column: span N` style from
 * `resolveDescriptionItemSpanStyle(item, columns)` for items that
 * span multiple columns.
 *
 * Three placement-modifier variants:
 *
 * - `--placement-left` (default) — label flex-row inline with
 *   value; label takes a min-width allocation for visual
 *   alignment.
 * - `--placement-top` — label flex-column stacked above value.
 *
 * Size modifiers (`--small / --medium / --large`) scale padding
 * inside each item cell.
 *
 * Bordered modifier adds a 1px solid outer border + 1px solid
 * per-item border so the grid resembles an HTML table.
 *
 * Two-level fallback (`var(--cx-ui-descriptions-*, fallback)`)
 * keeps the surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_DESCRIPTIONS_CSS = `
.cx-ui-descriptions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-descriptions-font-size, 14px);
  color: var(--cx-ui-descriptions-text-color, #1f2937);
}

.cx-ui-descriptions__title {
  font-weight: var(--cx-ui-descriptions-title-font-weight, 600);
  font-size: var(--cx-ui-descriptions-title-font-size, 15px);
  color: var(--cx-ui-descriptions-title-color, #111827);
  line-height: 1.3;
}

.cx-ui-descriptions__grid {
  display: grid;
  /* grid-template-columns set inline by adapter via
     resolveDescriptionsGridTemplateColumns. */
  gap: 0;
}

.cx-ui-descriptions__item {
  display: flex;
  min-width: 0;
  padding: var(--cx-ui-descriptions-item-padding, 8px 12px);
}

.cx-ui-descriptions__label {
  color: var(--cx-ui-descriptions-label-color, #6b7280);
  font-weight: var(--cx-ui-descriptions-label-font-weight, 500);
  flex: 0 0 auto;
}

.cx-ui-descriptions__value {
  color: var(--cx-ui-descriptions-value-color, #1f2937);
  flex: 1 1 auto;
  min-width: 0;
}

/* Placement modifiers — label position within each item cell. */
.cx-ui-descriptions--placement-left .cx-ui-descriptions__item {
  flex-direction: row;
  align-items: baseline;
  gap: 12px;
}

.cx-ui-descriptions--placement-left .cx-ui-descriptions__label {
  min-width: var(--cx-ui-descriptions-label-min-width-left, 80px);
}

.cx-ui-descriptions--placement-top .cx-ui-descriptions__item {
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
}

/* Size modifiers — padding scale. */
.cx-ui-descriptions--small .cx-ui-descriptions__item {
  padding: var(--cx-ui-descriptions-item-padding-small, 4px 8px);
}

.cx-ui-descriptions--medium .cx-ui-descriptions__item {
  padding: var(--cx-ui-descriptions-item-padding-medium, 8px 12px);
}

.cx-ui-descriptions--large .cx-ui-descriptions__item {
  padding: var(--cx-ui-descriptions-item-padding-large, 12px 16px);
}

/* Bordered modifier — table-like border + per-item separators. */
.cx-ui-descriptions--bordered .cx-ui-descriptions__grid {
  border: 1px solid var(--cx-ui-descriptions-border-color, #e5e7eb);
  border-radius: var(--cx-ui-descriptions-border-radius, 4px);
  overflow: hidden;
}

.cx-ui-descriptions--bordered .cx-ui-descriptions__item {
  border-right: 1px solid var(--cx-ui-descriptions-border-color, #e5e7eb);
  border-bottom: 1px solid var(--cx-ui-descriptions-border-color, #e5e7eb);
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'descriptions';

let injected = false;

/**
 * Inject the Descriptions stylesheet into `document.head` exactly
 * once. Sticky-flag semantics — once injected (or detected) the
 * flag stays `true` even if the `<style>` element is later
 * removed by the consumer.
 */
export function ensureChronixDescriptionsStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_DESCRIPTIONS_CSS;
  document.head.appendChild(style);
  injected = true;
}
