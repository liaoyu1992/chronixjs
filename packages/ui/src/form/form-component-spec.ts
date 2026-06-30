/**
 * chronix-ui form component spec — .
 *
 * Prop interfaces for ChronixForm and ChronixFormItem adapter components.
 * Validation logic lives in the existing modules (form-spec,
 * validate-field, validate-form, field-state). This file adds the
 * component-level layout + display props.
 */

import type { ValidationRule } from './validation-rule.js';

// ---------------------------------------------------------------------------
// ChronixForm
// ---------------------------------------------------------------------------

export type FormLabelPlacement = 'left' | 'top';
export type FormLabelAlign = 'left' | 'center' | 'right';
export type FormSize = 'small' | 'medium' | 'large';

export interface FormProps {
  /** Reactive form model — `Record<string, unknown>`. Path-based access via `getNestedValue`. */
  readonly model: Record<string, unknown>;
  /** Per-path validation rules. Key is the dot-path matching FormItem `path`. */
  readonly rules?: Readonly<Record<string, ValidationRule | readonly ValidationRule[]>>;
  /** Label position relative to content. Default `'top'`. */
  readonly labelPlacement?: FormLabelPlacement;
  /** Label width for left placement. Number → px; string passed through. */
  readonly labelWidth?: number | string;
  /** Label text alignment. Default `'left'`. */
  readonly labelAlign?: FormLabelAlign;
  /** Horizontal inline layout for simple forms. Default `false`. */
  readonly inline?: boolean;
  /** Component size inherited from context when omitted. */
  readonly size?: FormSize;
  /** Disable all child inputs. Inherited from context when omitted. */
  readonly disabled?: boolean;
  /** Show validation feedback messages. Default `true`. */
  readonly showFeedback?: boolean;
  /** Show required asterisk on required fields. `undefined` = auto-detect from rules. */
  readonly showRequireMark?: boolean | undefined;
  /** Prevent native form submission. Default `true`. */
  readonly preventSubmit?: boolean;
}

export const defaultFormProps: FormProps = {
  model: {},
  labelPlacement: 'top',
  labelAlign: 'left',
  inline: false,
  showFeedback: true,
  showRequireMark: undefined,
  preventSubmit: true,
};

// ---------------------------------------------------------------------------
// ChronixFormItem
// ---------------------------------------------------------------------------

export interface FormItemProps {
  /** Field label text. */
  readonly label?: string;
  /** Dot-path into form `model` (e.g. `'user.email'`). Required for validation. */
  readonly path?: string;
  /** Per-item validation rules. Overrides form-level `rules[path]` when provided. */
  readonly rule?: ValidationRule | readonly ValidationRule[];
  /** Per-item override of form `showFeedback`. */
  readonly showFeedback?: boolean | undefined;
  /** Explicitly set required mark. `undefined` = auto-detect from rules. */
  readonly required?: boolean | undefined;
  /** Per-item label width override. */
  readonly labelWidth?: number | string;
  /** Per-item label alignment override. */
  readonly labelAlign?: FormLabelAlign;
  /** Per-item label placement override. */
  readonly labelPlacement?: FormLabelPlacement;
  /** Per-item size override. */
  readonly size?: FormSize;
}

export const defaultFormItemProps: FormItemProps = {
  showFeedback: undefined,
  required: undefined,
};
