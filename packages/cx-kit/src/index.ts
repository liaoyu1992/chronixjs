/**
 * @chronixjs/cx-kit — headless UI primitives.
 *
 * Framework-agnostic UI building blocks used by chronix-table (and
 * potentially other chronix packages). Each primitive is a pure-logic
 * controller + types; rendering belongs to the consuming adapter.
 *
 * Phase 0 (2026-05-23): package skeleton.
 * Phase 96 (2026-05-31): KitVirtualList headless helper —
 *   `computeVirtualWindow` pure helper for uniform-height virtual
 *   lists. See `./virtual-list/`.
 * Phase 97 (2026-05-31): KitSlider headless helpers —
 *   `computeSliderValueAtPosition` + `computeSliderPositionForValue`
 *   + `computeSliderValueOnKey` with W3C ARIA APG keyboard
 *   semantics. See `./slider/`.
 * Phase 98 (2026-05-31): KitInputRange dual-handle range helpers —
 *   `computeRangeClosestHandle` + `computeRangeValueAtPosition` +
 *   `computeRangeValueOnKey` with overlap-clamp policy; builds on
 *   Phase 97 slider math. See `./input-range/`.
 * Phase 99 (2026-05-31): KitColorPicker headless helpers —
 *   RGB ↔ HSV ↔ HEX color conversions (`rgbToHsv` / `hsvToRgb` /
 *   `rgbToHex` / `hexToRgb`) + saturation-value square + hue strip
 *   pointer math. See `./color-picker/`.
 * Phase 100 (2026-05-31): KitAutocomplete headless helpers —
 *   `filterAutocompleteItems` (prefix/substring filter + ranking)
 *   + `computeMatchSpans` (highlight char-range computation).
 *   See `./autocomplete/`. **Completes cx-kit 5/5 primitives.**
 */

export const CX_KIT_PACKAGE_VERSION = '0.1.0-alpha.0';

export {
  DEFAULT_VIRTUAL_WINDOW_OVERSCAN,
  computeVirtualWindow,
  type VirtualWindow,
  type VirtualWindowInput,
} from './virtual-list/index.js';

export {
  DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER,
  computeSliderPositionForValue,
  computeSliderValueAtPosition,
  computeSliderValueOnKey,
  type SliderPositionForValueInput,
  type SliderValueAtPositionInput,
  type SliderValueOnKeyInput,
} from './slider/index.js';

export {
  computeRangeClosestHandle,
  computeRangeValueAtPosition,
  computeRangeValueOnKey,
  type RangeClosestHandleInput,
  type RangeHandle,
  type RangeValue,
  type RangeValueAtPositionInput,
  type RangeValueOnKeyInput,
} from './input-range/index.js';

export {
  computeHsvAtSquarePosition,
  computeHueAtStripPosition,
  computeSquarePositionForHsv,
  computeStripPositionForHue,
  hexToRgb,
  hsvToRgb,
  rgbToHex,
  rgbToHsv,
  type Hsv,
  type HsvAtSquarePositionInput,
  type HueAtStripPositionInput,
  type Rgb,
  type SquarePosition,
  type SquarePositionForHsvInput,
  type StripPositionForHueInput,
} from './color-picker/index.js';

export {
  computeMatchSpans,
  filterAutocompleteItems,
  type AutocompleteMatch,
  type AutocompleteMatchMode,
  type FilterAutocompleteItemsInput,
  type MatchSpan,
} from './autocomplete/index.js';
