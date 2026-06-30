import type { IconSpec } from './icon-spec.js';

/**
 * Standard 24×24 viewBox used by every chronix-NEW default icon. Pulled
 * out as a constant so consumers can match it when registering their
 * own icons for a coherent size-mixing experience.
 */
export const DEFAULT_ICON_VIEW_BOX = '0 0 24 24';

/**
 * The chronix-NEW default icon set — 12 essential glyphs covering the
 * needs of every Tier A/B/C component shipped through Phase ~120.
 *
 * . Paths are chronix-original simple geometric
 * shapes — readable but not pixel-art-perfect; consumers wanting
 * higher-quality icons replace via `registerIcon(...)` against the
 * same `name`. Replaceable names + their typical consumers:
 *
 * - `chevron-down` — Select / Cascader / Dropdown dropdown indicator,
 *   Tree collapsed-node toggle.
 * - `chevron-up` — opposite of chevron-down; expanded-node toggle.
 * - `chevron-left` — Pagination prev, DatePicker month-back.
 * - `chevron-right` — Pagination next, DatePicker month-forward,
 *   Tree expanded-node toggle.
 * - `close` — Modal / Drawer dismiss, Tag close, Input clear,
 *   Tab close-button, Notification dismiss.
 * - `check` — Checkbox checked mark, Select selected indicator.
 * - `minus` — Checkbox indeterminate mark.
 * - `search` — Input search prefix, AutoComplete / Mention triggers.
 * - `info` — Alert / Notification info status.
 * - `warning` — Alert / Notification warning status.
 * - `error` — Alert / Notification error status.
 * - `success` — Alert / Notification success status.
 */

const ICON_CHEVRON_DOWN: IconSpec = {
  name: 'chevron-down',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [{ d: 'M5 8 L19 8 L12 16 Z' }],
};

const ICON_CHEVRON_UP: IconSpec = {
  name: 'chevron-up',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [{ d: 'M5 16 L19 16 L12 8 Z' }],
};

const ICON_CHEVRON_LEFT: IconSpec = {
  name: 'chevron-left',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [{ d: 'M16 5 L8 12 L16 19 Z' }],
};

const ICON_CHEVRON_RIGHT: IconSpec = {
  name: 'chevron-right',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [{ d: 'M8 5 L16 12 L8 19 Z' }],
};

const ICON_CLOSE: IconSpec = {
  name: 'close',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [
    {
      d: 'M4.6 6L6 4.6L12 10.6L18 4.6L19.4 6L13.4 12L19.4 18L18 19.4L12 13.4L6 19.4L4.6 18L10.6 12Z',
    },
  ],
};

const ICON_CHECK: IconSpec = {
  name: 'check',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [{ d: 'M9 17 L4 12 L5.4 10.6 L9 14.2 L18.6 4.6 L20 6 Z' }],
};

const ICON_MINUS: IconSpec = {
  name: 'minus',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [{ d: 'M5 11 L19 11 L19 13 L5 13 Z' }],
};

// Search: outer circle - inner circle (evenodd produces ring) plus a
// rectangular handle from the lens edge to the bottom-right.
const ICON_SEARCH: IconSpec = {
  name: 'search',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [
    {
      d: 'M10 3 a7 7 0 1 0 0 14 a7 7 0 1 0 0 -14 Z M10 5.5 a4.5 4.5 0 1 1 0 9 a4.5 4.5 0 1 1 0 -9 Z M15.6 14.9 L20.5 19.8 L19.1 21.2 L14.2 16.3 Z',
      fillRule: 'evenodd',
    },
  ],
};

// Status icons — filled background circle (or triangle) plus a separate
// foreground glyph drawn in the contrasting fill (rendered by SVG
// `fill: currentColor` inheriting; consumers typically wrap the icon
// with a color matching the status semantic).

// Info: circle + lowercase "i" (dot + bar)
const ICON_INFO: IconSpec = {
  name: 'info',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [
    {
      d: 'M12 2 a10 10 0 1 0 0 20 a10 10 0 1 0 0 -20 Z M11 10 L13 10 L13 17 L11 17 Z M11 7 L13 7 L13 9 L11 9 Z',
      fillRule: 'evenodd',
    },
  ],
};

// Warning: triangle + "!"
const ICON_WARNING: IconSpec = {
  name: 'warning',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [
    {
      d: 'M12 2 L23 21 L1 21 Z M11 9 L13 9 L13 14 L11 14 Z M11 16 L13 16 L13 18 L11 18 Z',
      fillRule: 'evenodd',
    },
  ],
};

// Error: circle + X
const ICON_ERROR: IconSpec = {
  name: 'error',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [
    {
      d: 'M12 2 a10 10 0 1 0 0 20 a10 10 0 1 0 0 -20 Z M8 8 L9.4 6.6 L12 9.2 L14.6 6.6 L16 8 L13.4 10.6 L16 13.2 L14.6 14.6 L12 12 L9.4 14.6 L8 13.2 L10.6 10.6 Z',
      fillRule: 'evenodd',
    },
  ],
};

// Success: circle + check
const ICON_SUCCESS: IconSpec = {
  name: 'success',
  viewBox: DEFAULT_ICON_VIEW_BOX,
  paths: [
    {
      d: 'M12 2 a10 10 0 1 0 0 20 a10 10 0 1 0 0 -20 Z M10.5 15.5 L6 11 L7.4 9.6 L10.5 12.7 L16.6 6.6 L18 8 Z',
      fillRule: 'evenodd',
    },
  ],
};

/**
 * The full array of chronix-NEW default icons, in the order they're
 * registered at module-load time. Exposed for diagnostics + tests; the
 * runtime API is `getIcon` / `listIconNames` from `./icon-registry.ts`.
 */
export const DEFAULT_ICONS: readonly IconSpec[] = [
  ICON_CHEVRON_DOWN,
  ICON_CHEVRON_UP,
  ICON_CHEVRON_LEFT,
  ICON_CHEVRON_RIGHT,
  ICON_CLOSE,
  ICON_CHECK,
  ICON_MINUS,
  ICON_SEARCH,
  ICON_INFO,
  ICON_WARNING,
  ICON_ERROR,
  ICON_SUCCESS,
];
