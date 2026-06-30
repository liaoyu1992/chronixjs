/**
 * DynamicInput component IR — .
 *
 * Props spec for a dynamic list of values where the user can add or
 * remove items. The adapter renders one input row per value entry plus
 * add/remove action buttons.
 */

export interface DynamicInputProps {
  readonly value: readonly unknown[];
  readonly min?: number;
  readonly max?: number | undefined;
  readonly disabled?: boolean | undefined;
  readonly placeholder?: string;
}

export const defaultDynamicInputProps: DynamicInputProps = {
  value: [],
  min: 0,
  disabled: false,
  placeholder: '',
};
