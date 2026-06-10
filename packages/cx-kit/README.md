# @chronixjs/cx-kit

Headless UI primitives for chronix packages. Framework-agnostic pure-logic helpers + types — no rendering, no DOM, no framework binding. Rendering lives in the consuming adapter (chronix-table's `@chronixjs/table-{vue3,vue2,react}` packages, or your own).

> **Status.** Currently published under the `alpha` npm dist-tag (`@alpha`). After v0.1.0 GA lands, the `@alpha` suffix can be omitted. APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/cx-kit@alpha       # currently
pnpm add @chronixjs/cx-kit             # after v0.1.0 GA
```

If you're using chronix-table via `@chronixjs/table-vue3` / `-vue2` / `-react`, this package is pulled transitively — you don't install it separately unless you need the primitives in your own renderer.

## What's in here

5/5 primitives shipped in v0.1.0. Each is a pure-logic controller (no DOM); the consuming adapter renders.

### KitVirtualList (Phase 96.1)

Uniform-height virtual list. Computes the visible window of items given total count + item height + scroll position.

```ts
import { computeVirtualWindow } from '@chronixjs/cx-kit';

const window = computeVirtualWindow({
  totalItemCount: 10_000,
  itemHeightPx: 32,
  scrollTop: 500,
  viewportHeight: 400,
  overscan: 4,
});
// window.startIndex / window.endIndex / window.offsetTopPx / window.totalHeightPx
```

Exports: `computeVirtualWindow`, `DEFAULT_VIRTUAL_WINDOW_OVERSCAN`, `VirtualWindow`, `VirtualWindowInput`.

**Consumer**: chronix-table set-filter dropdown virtualization (Phase 96.2 — threshold-gated).

### KitSlider (Phase 97.1)

Single-value horizontal slider with W3C ARIA APG keyboard semantics.

Exports: `computeSliderValueAtPosition`, `computeSliderPositionForValue`, `computeSliderValueOnKey`, `DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER`.

**Consumer**: chronix-table number-filter range slider (Phase 98.2) + cell-style editor font-weight slider (Phase 99.2.2.2 — inline math).

### KitInputRange (Phase 98.1)

Dual-handle range slider built on KitSlider. Includes overlap-clamp policy and closest-handle math for pointerdown gestures.

Exports: `computeRangeClosestHandle`, `computeRangeValueAtPosition`, `computeRangeValueOnKey`.

**Consumer**: chronix-table number-filter range slider (Phase 98.2).

### KitColorPicker (Phase 99.1)

HSV ↔ RGB ↔ HEX color conversions + saturation-value square + hue strip pointer math.

```ts
import { rgbToHex, hexToRgb, rgbToHsv, hsvToRgb } from '@chronixjs/cx-kit';

const hex = rgbToHex({ r: 255, g: 87, b: 51 }); // "#FF5733"
const rgb = hexToRgb('#FF5733'); // { r, g, b }
const hsv = rgbToHsv(rgb); // { h, s, v }
```

Exports: `computeHsvAtSquarePosition`, `computeStripPositionForHue`, `hsvToRgb`, `rgbToHsv`, `rgbToHex`, `hexToRgb`.

**Consumer**: chronix-table cell-style editor HSV picker on the bg / text / border tabs (Phase 99.2 + 99.2.1 + 99.2.3.2).

### KitAutocomplete (Phase 100.1) — completes cx-kit 5/5

Typeahead filtering + match-span highlight computation.

Exports: `filterAutocompleteItems`, `computeMatchSpans`.

**Consumer**: chronix-table advanced-filter typeahead — 4-slot detector (column / operator / conjunction / value; Phase 100.2 + 100.2.x). Ships ALL 14 originally-scoped sub-phases including histogram count badge, date-value formatter, custom operator dict, i18n labels, auto-trigger, auto-scroll, string-literal-internal commit, per-slot recent LRU rings, and SSR-async value getter with request-id race-discard.

## Quick start (standalone)

The primitives have no framework runtime — call the pure functions and own the render.

```ts
import { computeVirtualWindow, rgbToHex } from '@chronixjs/cx-kit';

// Virtualize a 100k-item list inside a 400px-tall scroll container.
const window = computeVirtualWindow({
  totalItemCount: 100_000,
  itemHeightPx: 24,
  scrollTop: scrollContainerEl.scrollTop,
  viewportHeight: 400,
  overscan: 4,
});

// Render items[window.startIndex .. window.endIndex] inside a wrapper
// translated by window.offsetTopPx, with parent height = window.totalHeightPx.

// Color conversion (e.g. for a custom HSV picker UI):
const hex = rgbToHex({ r: 255, g: 87, b: 51 }); // "#FF5733"
```

## Parity

`@chronixjs/cx-kit` is a chronix-NEW design (no original implementation). 5/5 primitives + their helpers are covered by **151 unit tests**. See `audit/TABLE_PHASE_96_*` through `audit/TABLE_PHASE_100_*` in the monorepo for per-phase decision records.

## License

[MIT](./LICENSE) © liaoyu1992
