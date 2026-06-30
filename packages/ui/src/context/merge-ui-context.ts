import { mergeChronixUITheme } from '../theme/merge-ui-theme.js';

import type {
  ChronixUIComponentOverrides,
  ChronixUIContext,
  ChronixUIContextOverrides,
} from './chronix-ui-context.js';
import type { ChronixUITheme } from '../theme/chronix-ui-theme.js';

/**
 * Deep-merge a `ChronixUIContextOverrides` overlay on top of a parent
 * `ChronixUIContext`. Nested providers compose by calling this function
 * with the outer provider's resolved context as the `parent` and the
 * inner provider's prop bag as `overrides`.
 *
 * per Decision A.1.
 *
 * Merge rules per field:
 *
 * - **`theme`** — deep-merged via `mergeChronixUITheme`. Overlay can be
 *   either a full `ChronixUITheme` (replace) or a
 *   `ChronixUIThemeOverrides` (partial slice merge). The function
 *   detects which by checking for the `common` slice's presence + shape;
 *   when in doubt, treat as overrides.
 * - **`componentOverrides`** — deep-merged per-component-key. Within
 *   each component key, the override props are spread over the parent's
 *   props for that key.
 * - **All other scalar fields** (`locale`, `size`, `clsPrefix`,
 *   `disabled`, `portalContainer`, `rtl`) — shallow override: if the
 *   overlay provides a value, it wins; otherwise the parent value
 *   propagates. `undefined` in the overlay is treated as "no override"
 *   (not as "set to undefined"), unlike the theme module's policy.
 *
 * Immutability: returns a new object; never mutates `parent` or
 * `overrides`. Fields not touched by the overrides are reference-equal
 * to the parent's values (no spurious copies).
 */
export function mergeUIContext(
  parent: ChronixUIContext,
  overrides: ChronixUIContextOverrides | undefined,
): ChronixUIContext {
  if (!overrides) return parent;
  return {
    theme: resolveThemeOverride(parent.theme, overrides.theme),
    locale: overrides.locale ?? parent.locale,
    size: overrides.size ?? parent.size,
    clsPrefix: overrides.clsPrefix ?? parent.clsPrefix,
    disabled: overrides.disabled ?? parent.disabled,
    portalContainer: overrides.portalContainer ?? parent.portalContainer,
    rtl: overrides.rtl ?? parent.rtl,
    componentOverrides: mergeComponentOverrides(
      parent.componentOverrides,
      overrides.componentOverrides,
    ),
  };
}

/**
 * Determine whether a theme overlay is a full `ChronixUITheme` (replace
 * outright) or a `ChronixUIThemeOverrides` (deep-merge slice-by-slice).
 *
 * Heuristic: a full theme has both `common` and `button` slices present
 * with the full common-slice shape (we sample `primaryColor` as the
 * tell). Partial overrides typically omit at least one slice or include
 * only a subset of fields.
 *
 * This heuristic is safe because:
 *
 * - Consumers passing a curated theme (e.g. `defaultChronixUIThemeDark`)
 *   always have all slices + all fields → full-theme branch.
 * - Consumers passing partial overrides (e.g. `{ common: { primaryColor }
 *   }`) typically omit other slices or fields → overrides branch.
 * - Edge case: a consumer who passes `{ common: <full-common>, button:
 *   <full-button> }` triggers the full-theme branch; result is identical
 *   to the overrides branch in that case (both produce the same output).
 */
function resolveThemeOverride(
  parent: ChronixUITheme,
  overlay: ChronixUIContextOverrides['theme'],
): ChronixUITheme {
  if (!overlay) return parent;
  if (isFullTheme(overlay)) return overlay;
  return mergeChronixUITheme(parent, overlay);
}

function isFullTheme(value: object): value is ChronixUITheme {
  if (!('common' in value) || !('button' in value)) return false;
  const common = (value as { common: unknown }).common;
  // Sample one signature field; a real ChronixUIThemeCommon always has it.
  return (
    typeof common === 'object' &&
    common !== null &&
    'primaryColor' in common &&
    'fontFamily' in common
  );
}

/**
 * Deep-merge `componentOverrides`: per-component-key, spread overlay
 * props over parent props.
 */
function mergeComponentOverrides(
  parent: ChronixUIComponentOverrides,
  overlay: ChronixUIComponentOverrides | undefined,
): ChronixUIComponentOverrides {
  if (!overlay) return parent;
  const overlayKeys = Object.keys(overlay);
  if (overlayKeys.length === 0) return parent;
  const result: ChronixUIComponentOverrides = { ...parent };
  for (const key of overlayKeys) {
    const overlaySlice = overlay[key];
    if (!overlaySlice) continue;
    const parentSlice = parent[key];
    result[key] = parentSlice ? { ...parentSlice, ...overlaySlice } : { ...overlaySlice };
  }
  return result;
}
