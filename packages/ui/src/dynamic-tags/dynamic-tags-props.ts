/**
 * DynamicTags component IR — .
 *
 * Props spec for an inline tag editor where the user can add tags by
 * typing and remove them via a close icon on each tag chip.
 */

export interface DynamicTagsProps {
  readonly value: readonly string[];
  readonly max?: number | undefined;
  readonly closable?: boolean | undefined;
  readonly disabled?: boolean | undefined;
}

export const defaultDynamicTagsProps: DynamicTagsProps = {
  value: [],
  closable: true,
  disabled: false,
};
