import type { ChronixTableTheme } from './chronix-table-theme.js';

/**
 * Geometry tokens (number-typed) emit with a `px` suffix in the
 * resulting CSS var value. Color tokens (string-typed) pass
 * through as raw strings.
 */
const GEOMETRY_TOKENS: readonly (keyof ChronixTableTheme)[] = [
  'defaultColumnWidth',
  'defaultMinColumnWidth',
  'headerHeight',
  'rowHeight',
  'cellPaddingX',
  'selectionColumnWidth',
  'headerGroupHeight',
  'footerHeight',
  'treeIndentPx',
  'statusBarHeight',
];

/**
 * Convert a `ChronixTableTheme` to a record of CSS custom properties
 * the adapter inlines on `.cx-table-wrapper`'s style attribute.
 *
 * Phase 6 (2026-05-23). Naming convention: each theme field name is
 * kebab-cased + prefixed with `--cx-table-`. Geometry fields get a
 * `px` unit suffix; color fields pass through as raw strings.
 *
 * Examples:
 *
 * - `headerBg: '#f1f3f5'` → `'--cx-table-header-bg': '#f1f3f5'`
 * - `headerHeight: 32` → `'--cx-table-header-height': '32px'`
 *
 * Returned record contains string-only values, safe to spread into
 * a Vue `style` object or React `style` prop.
 */
export function cssVarsForTheme(theme: ChronixTableTheme): Record<string, string> {
  const out: Record<string, string> = {};
  // Iterate the theme's keys directly so adding a new field to
  // ChronixTableTheme + GEOMETRY_TOKENS automatically extends the
  // CSS-var surface without touching this function.
  for (const key of Object.keys(theme) as (keyof ChronixTableTheme)[]) {
    const cssName = '--cx-table-' + toKebab(String(key));
    const value = theme[key];
    if (GEOMETRY_TOKENS.includes(key) && typeof value === 'number') {
      out[cssName] = `${value}px`;
    } else {
      out[cssName] = String(value);
    }
  }
  return out;
}

/** Convert camelCase identifier to kebab-case. Pure helper. */
function toKebab(name: string): string {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase();
}
