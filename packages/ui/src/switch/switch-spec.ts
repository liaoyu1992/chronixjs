/**
 * Switch component IR — . Tier B boolean toggle
 * surface. Root element is `<button role="switch">` for native keyboard
 * activation + a11y semantics.
 */

export type SwitchSize = 'small' | 'medium' | 'large';

export interface SwitchProps {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly size: SwitchSize;
  readonly error: string | undefined;
}

export const defaultSwitchProps: SwitchProps = {
  checked: false,
  disabled: false,
  size: 'medium',
  error: undefined,
};
