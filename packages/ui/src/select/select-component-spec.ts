/**
 * Select component IR — .
 *
 * Full-featured select: single/multi, filterable, virtual scrolling,
 * clearable, loading state. Combines `OptionSpec` shared types with
 * Select-specific props and class resolvers.
 */

import type { SelectOption } from './option-spec.js';
import type { PopupPlacement } from '../popup/popup-spec.js';

export interface SelectProps {
  /** Current value: single `string` or `string[]` (when `multiple`). */
  readonly value: string | readonly string[] | undefined;
  /** Flat or nested options. Array-only authoring. */
  readonly options: readonly SelectOption[];
  /** Multi-select mode. When true, value is `string[]`. */
  readonly multiple: boolean;
  /** Enable local filter/search input. */
  readonly filterable: boolean;
  /** Show clear icon to reset selection. */
  readonly clearable: boolean;
  /** Placeholder text when nothing selected. */
  readonly placeholder: string;
  /** Disable the entire select. */
  readonly disabled: boolean;
  /** Show loading spinner in dropdown. */
  readonly loading: boolean;
  /** Enable virtual scrolling for large option lists. */
  readonly virtual: boolean;
  /** Item height in pixels for virtual scrolling. Default 32. */
  readonly virtualItemHeight: number;
  /** Dropdown placement. Default 'bottom-start'. */
  readonly placement: PopupPlacement;
}

export const defaultSelectProps: SelectProps = {
  value: undefined,
  options: [],
  multiple: false,
  filterable: false,
  clearable: false,
  placeholder: '',
  disabled: false,
  loading: false,
  virtual: false,
  virtualItemHeight: 32,
  placement: 'bottom-start',
};
