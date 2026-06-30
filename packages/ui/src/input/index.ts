/**
 * chronix-ui input module — .
 *
 * Pure-function helpers for user-input coercion and navigation. No DOM
 * access, no framework dependency. Adapters wire DOM events to these
 * helpers; the helpers compute the resulting value / state.
 *
 * Public surface:
 *
 * - **Number input**:
 *   - `parseNumberInput(raw, options?)` — string → number | null with
 *     configurable decimal + thousand separators.
 *   - `clampNumberInput(value, options?)` — min/max clamp + step snap.
 *   - `formatNumberInput(value, options?)` — number → string with
 *     precision, thousand separator, locale decimal.
 * - **Keyboard navigation**:
 *   - `composeKeyboardSelection({ currentKey, availableKeys, direction, wrap? })`
 *     — next selected key for up / down / home / end navigation over
 *     ordered keys. Used by Select, Cascader, Dropdown, Menu, etc.
 * - **IME composition**:
 *   - `ImeCompositionState` + `createImeCompositionState` +
 *     `withCompositionStart` / `withCompositionUpdate` /
 *     `withCompositionEnd` transactions for gating side effects during
 *     multi-keystroke IME input (CJK / Korean / Vietnamese / etc.).
 */

export type { ParseNumberInputOptions } from './parse-number-input.js';
export { parseNumberInput } from './parse-number-input.js';
export type { ClampNumberInputOptions } from './clamp-number-input.js';
export { clampNumberInput } from './clamp-number-input.js';
export type { FormatNumberInputOptions } from './format-number-input.js';
export { formatNumberInput } from './format-number-input.js';
export type {
  ComposeKeyboardSelectionInput,
  KeyboardSelectionDirection,
} from './compose-keyboard-selection.js';
export { composeKeyboardSelection } from './compose-keyboard-selection.js';
export type { ImeCompositionState } from './ime-composition-state.js';
export {
  createImeCompositionState,
  withCompositionEnd,
  withCompositionStart,
  withCompositionUpdate,
} from './ime-composition-state.js';

/**
 * — Input component IR (Tier B form input).
 * Single export with `type: 'text' | 'textarea'` variant
 * discriminator. See `./input-props.ts` for props + `getInputInnerTag`
 * helper, `./resolve-input-class-list.ts` for class-list resolution,
 * `./input-styles.ts` for the CSS + sticky-flag injector.
 */
export type { InputProps, InputSize, InputType } from './input-props.js';
export { defaultInputProps, getInputInnerTag } from './input-props.js';
export { resolveInputClassList } from './resolve-input-class-list.js';
export { CHRONIX_INPUT_CSS, ensureChronixInputStyles } from './input-styles.js';
