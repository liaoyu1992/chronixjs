/**
 * Input component IR — . Tier B text-entry
 * surface. Single export with `type: 'text' | 'textarea'` variant
 * discriminator (one Input component covers both single-line + multi-
 * line cases).
 *
 * Co-located with input helpers (parseNumberInput /
 * clampNumberInput / formatNumberInput / composeKeyboardSelection /
 * ImeCompositionState) which are consumed by InputNumber + AutoComplete
 * in this same wave.
 */

export type InputType = 'text' | 'textarea';

export type InputSize = 'small' | 'medium' | 'large';

export interface InputProps {
  readonly value: string;
  readonly type: InputType;
  readonly placeholder: string | undefined;
  readonly disabled: boolean;
  readonly clearable: boolean;
  readonly size: InputSize;
  readonly rows: number;
  readonly error: string | undefined;
}

export const defaultInputProps: InputProps = {
  value: '',
  type: 'text',
  placeholder: undefined,
  disabled: false,
  clearable: false,
  size: 'medium',
  rows: 3,
  error: undefined,
};

/** Map the type prop to the HTML tag the adapter should render. */
export function getInputInnerTag(props: InputProps): 'input' | 'textarea' {
  return props.type === 'textarea' ? 'textarea' : 'input';
}
