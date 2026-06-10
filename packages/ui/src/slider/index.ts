/**
 * Slider module — Phase 33 (2026-06-05).
 *
 * Framework-agnostic slider IR: marks computation, BEM class
 * resolvers, CSS. Value/position math delegated to
 * `@chronixjs/cx-kit/slider` + `@chronixjs/cx-kit/input-range`.
 */

export type { SliderMark, SliderProps } from './slider-spec.js';
export { defaultSliderProps } from './slider-spec.js';

export type { ComputedSliderMark } from './compute-slider-marks.js';
export { computeSliderMarks } from './compute-slider-marks.js';

export type {
  ResolveSliderMarkClassListInput,
  ResolveSliderRootClassListInput,
  ResolveSliderThumbClassListInput,
} from './resolve-slider-class-list.js';
export {
  resolveSliderFillClassList,
  resolveSliderMarkClassList,
  resolveSliderMarkLabelClassList,
  resolveSliderMarksClassList,
  resolveSliderRootClassList,
  resolveSliderThumbClassList,
  resolveSliderTrackClassList,
} from './resolve-slider-class-list.js';

export { CHRONIX_SLIDER_CSS, ensureChronixSliderStyles } from './slider-styles.js';
