/**
 * ColorPicker module — Phase 33 (2026-06-05).
 *
 * Framework-agnostic color picker IR: BEM class resolvers, CSS.
 * Color math delegated to `@chronixjs/cx-kit/color-picker`.
 */

export type { ColorPickerProps } from './color-picker-spec.js';
export { defaultColorPickerProps } from './color-picker-spec.js';

export type {
  ResolveColorPickerRootClassListInput,
  ResolveColorPickerSwatchClassListInput,
  ResolveColorPickerTriggerClassListInput,
} from './resolve-color-picker-class-list.js';
export {
  resolveColorPickerAlphaStripClassList,
  resolveColorPickerHueStripClassList,
  resolveColorPickerPanelClassList,
  resolveColorPickerRootClassList,
  resolveColorPickerSquareClassList,
  resolveColorPickerSwatchClassList,
  resolveColorPickerTriggerClassList,
} from './resolve-color-picker-class-list.js';

export { CHRONIX_COLOR_PICKER_CSS, ensureChronixColorPickerStyles } from './color-picker-styles.js';
