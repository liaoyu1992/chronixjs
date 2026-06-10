/**
 * AutoComplete component IR — Phase 25 (2026-06-03). Tier B text-entry
 * with consumer-supplied options + chronix-internal substring filter.
 *
 * NOTE on positioning: AutoComplete ships **without** Phase 4 PopupSpec
 * dependency for v0.1.0-alpha — the suggestion list is rendered inline
 * via `position: absolute` inside a `position: relative` wrapper. Phase
 * 26+ may retrofit to portal-rendered Popover in v0.2 once the Popover
 * infrastructure is stable.
 */

export type AutoCompleteSize = 'small' | 'medium' | 'large';

export interface AutoCompleteOption {
  readonly key: string;
  readonly label: string;
  readonly value: string;
}

export interface AutoCompleteProps {
  readonly value: string;
  readonly options: readonly AutoCompleteOption[];
  readonly placeholder: string | undefined;
  readonly disabled: boolean;
  readonly size: AutoCompleteSize;
  readonly error: string | undefined;
}

export const defaultAutoCompleteProps: AutoCompleteProps = {
  value: '',
  options: [],
  placeholder: undefined,
  disabled: false,
  size: 'medium',
  error: undefined,
};

/**
 * Case-insensitive substring filter. Empty query (`''`) returns the
 * options unfiltered. Returns the original array reference when no
 * filtering is needed (cheap fast-path).
 */
export function filterAutoCompleteOptions(
  options: readonly AutoCompleteOption[],
  query: string,
): readonly AutoCompleteOption[] {
  if (query === '') return options;
  const needle = query.toLowerCase();
  return options.filter((o) => o.label.toLowerCase().includes(needle));
}
