/**
 * Radio + RadioGroup component IR — Phase 25 (2026-06-03). Tier B
 * single-selection-from-set surface. Radio is exported as a standalone
 * component but typical authoring path is `<ChronixRadioGroup>` with
 * array-only `options` prop (Phase 19 Breadcrumb precedent for
 * array-only authoring; sub-component slot-nested Radio is
 * foreclosed in v0.1.0-alpha).
 */

export interface RadioOption {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly disabled: boolean;
}

export interface RadioGroupProps {
  readonly value: string;
  readonly options: readonly RadioOption[];
  readonly disabled: boolean;
  readonly error: string | undefined;
}

export const defaultRadioGroupProps: RadioGroupProps = {
  value: '',
  options: [],
  disabled: false,
  error: undefined,
};

export interface RadioProps {
  readonly checked: boolean;
  readonly value: string;
  readonly label: string;
  readonly disabled: boolean;
}

export const defaultRadioProps: RadioProps = {
  checked: false,
  value: '',
  label: '',
  disabled: false,
};
