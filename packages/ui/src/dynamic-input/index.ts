/**
 * chronix-ui dynamic-input module — .
 *
 * Pure-function helpers for a dynamic value-list component where items
 * can be added and removed. No DOM access, no framework dependency.
 */

export type { DynamicInputProps } from './dynamic-input-props.js';
export { defaultDynamicInputProps } from './dynamic-input-props.js';

export type { ResolveDynamicInputClassListInput } from './resolve-dynamic-input-class-list.js';
export { resolveDynamicInputClassList } from './resolve-dynamic-input-class-list.js';

export {
  CHRONIX_DYNAMIC_INPUT_CSS,
  ensureChronixDynamicInputStyles,
} from './dynamic-input-styles.js';

export { createDynamicInputItem } from './dynamic-input-helper.js';
