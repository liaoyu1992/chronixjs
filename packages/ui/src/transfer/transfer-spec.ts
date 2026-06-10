/**
 * Transfer component IR — Phase 33 (2026-06-05).
 *
 * Dual-panel transfer with search filter. Uses cx-kit
 * `filterAutocompleteItems` for search. Value is array of
 * selected option values.
 */

export interface TransferOption {
  /** Display label. */
  readonly label: string;
  /** Unique value identifier. */
  readonly value: string | number;
  /** Disable this individual option. */
  readonly disabled?: boolean;
}

export interface TransferProps {
  /** Currently selected values (target panel). */
  readonly value: readonly (string | number)[];
  /** All available options. */
  readonly options: readonly TransferOption[];
  /** Disable the entire transfer. */
  readonly disabled: boolean;
  /** Enable search filter on both panels. */
  readonly filterable: boolean;
  /** Source panel title. Default 'Source'. */
  readonly sourceTitle: string;
  /** Target panel title. Default 'Target'. */
  readonly targetTitle: string;
  /** Source panel filter placeholder. */
  readonly sourceFilterPlaceholder: string;
  /** Target panel filter placeholder. */
  readonly targetFilterPlaceholder: string;
}

export const defaultTransferProps: TransferProps = {
  value: [],
  options: [],
  disabled: false,
  filterable: false,
  sourceTitle: 'Source',
  targetTitle: 'Target',
  sourceFilterPlaceholder: '',
  targetFilterPlaceholder: '',
};
