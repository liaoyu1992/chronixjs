export type { OptionSpec, OptionGroupSpec, SelectOption } from './option-spec.js';
export { isOptionGroup } from './option-spec.js';

export { normalizeSelectValue } from './resolve-select-value.js';

export type { FlatOptionEntry } from './flatten-select-options.js';
export { flattenSelectOptions } from './flatten-select-options.js';

export { filterSelectOptions } from './filter-select-options.js';

export type { SelectProps } from './select-component-spec.js';
export { defaultSelectProps } from './select-component-spec.js';

export type {
  ResolveSelectRootClassListInput,
  ResolveSelectTriggerClassListInput,
  ResolveSelectDropdownClassListInput,
  ResolveSelectOptionClassListInput,
} from './resolve-select-class-list.js';
export {
  resolveSelectRootClassList,
  resolveSelectTriggerClassList,
  resolveSelectDropdownClassList,
  resolveSelectOptionClassList,
  resolveSelectArrowClassList,
  resolveSelectEmptyClassList,
  resolveSelectTagClassList,
  resolveSelectTagCloseClassList,
  resolveSelectFilterInputClassList,
} from './resolve-select-class-list.js';

export { CHRONIX_SELECT_CSS, ensureChronixSelectStyles } from './select-styles.js';
