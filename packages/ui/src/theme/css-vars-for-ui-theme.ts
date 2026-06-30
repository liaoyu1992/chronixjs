import type { ChronixUITheme } from './chronix-ui-theme.js';

/**
 * Convert a `ChronixUITheme` to a record of CSS custom properties the
 * adapter inlines on the `<ChronixUIProvider>` root element's `style`.
 *
 * per Decision A.1.
 *
 * Naming convention:
 *
 * - The `common` slice is **prefix-suppressed** — its keys become
 *   `--cx-ui-{kebab(key)}` directly. This reflects that common tokens
 *   are the shared baseline; no slice-name qualifier is needed.
 * - Per-component slices (`button`, future `tree` / `select` / …) emit
 *   as `--cx-ui-{slice}-{kebab(key)}`.
 *
 * Examples:
 *
 * - `theme.common.primaryColor: '#18a058'` → `'--cx-ui-primary-color': '#18a058'`
 * - `theme.common.borderRadius: '3px'` → `'--cx-ui-border-radius': '3px'`
 * - `theme.button.textColor: '#1f2937'` → `'--cx-ui-button-text-color': '#1f2937'`
 * - `theme.button.fontWeight: 400` → `'--cx-ui-button-font-weight': '400'`
 *
 * Value-typing rule: theme tokens are pre-formatted strings (length tokens
 * include units like `'8px'`); unitless numerics (font weights, line
 * heights) are emitted as their string form. The converter does NOT
 * append units — that's the theme author's job. This keeps the converter
 * trivial and avoids guessing whether a number means pixels, rem, ms,
 * or unitless count.
 *
 * Returned record contains string-only values, safe to spread into a
 * Vue `style` object, React `style` prop, or template-literal
 * `style="..."` string.
 */
export function cssVarsForUITheme(theme: ChronixUITheme): Record<string, string> {
  const out: Record<string, string> = {};
  for (const sliceName of Object.keys(theme) as (keyof ChronixUITheme)[]) {
    const slice = theme[sliceName];
    const slicePrefix =
      sliceName === 'common' ? '--cx-ui-' : `--cx-ui-${toKebab(String(sliceName))}-`;
    for (const tokenKey of Object.keys(slice)) {
      const cssName = slicePrefix + toKebab(tokenKey);
      const value = (slice as unknown as Record<string, string | number>)[tokenKey];
      out[cssName] = value === undefined ? '' : String(value);
    }
  }
  return out;
}

/** Convert camelCase identifier to kebab-case. Pure helper. */
function toKebab(name: string): string {
  return name.replace(/([A-Z])/g, '-$1').toLowerCase();
}
