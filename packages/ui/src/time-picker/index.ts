/**
 * TimePicker module — Phase 32 (2026-06-05).
 *
 * Framework-agnostic time picker IR: time unit generation,
 * formatting/parsing, BEM class resolvers, CSS.
 */

export type { TimePickerProps } from './time-picker-spec.js';
export { defaultTimePickerProps } from './time-picker-spec.js';

export type { GenerateTimeUnitsOptions, TimeUnits } from './generate-time-units.js';
export { findNearestTimeValue, generateTimeUnits } from './generate-time-units.js';

export { formatTimeValue } from './format-time-value.js';
export { parseTimeString } from './parse-time-string.js';

export type {
  ResolveTimePickerColumnItemClassListInput,
  ResolveTimePickerRootClassListInput,
  ResolveTimePickerTriggerClassListInput,
} from './resolve-time-picker-class-list.js';
export {
  resolveTimePickerColumnClassList,
  resolveTimePickerColumnItemClassList,
  resolveTimePickerPanelClassList,
  resolveTimePickerRootClassList,
  resolveTimePickerTriggerClassList,
} from './resolve-time-picker-class-list.js';

export { CHRONIX_TIME_PICKER_CSS, ensureChronixTimePickerStyles } from './time-picker-styles.js';
