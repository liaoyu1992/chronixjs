/**
 * chronix-ui form BEM class-list resolvers — Phase 34 (2026-06-05).
 *
 * Pure functions returning `string[]` of BEM class names. Each resolver
 * is deterministic — same inputs always produce the same class list.
 * Adapters call these in computed / useMemo and join with `' '`.
 */

import type { FormLabelAlign, FormLabelPlacement, FormSize } from './form-component-spec.js';

// ---------------------------------------------------------------------------
// ChronixForm
// ---------------------------------------------------------------------------

export interface ResolveFormClassListInput {
  readonly inline: boolean;
  readonly labelPlacement: FormLabelPlacement;
}

export function resolveFormClassList(input: ResolveFormClassListInput): string[] {
  const cls = ['cx-ui-form'];
  if (input.inline) cls.push('cx-ui-form--inline');
  cls.push(input.labelPlacement === 'left' ? 'cx-ui-form--left-label' : 'cx-ui-form--top-label');
  return cls;
}

// ---------------------------------------------------------------------------
// ChronixFormItem
// ---------------------------------------------------------------------------

export interface ResolveFormItemClassListInput {
  readonly size: FormSize;
  readonly labelPlacement: FormLabelPlacement;
  readonly hasLabel: boolean;
  readonly hasError: boolean;
}

export function resolveFormItemClassList(input: ResolveFormItemClassListInput): string[] {
  const cls = ['cx-ui-form-item'];
  cls.push(`cx-ui-form-item--${input.size}-size`);
  if (input.hasLabel) {
    cls.push(
      input.labelPlacement === 'left'
        ? 'cx-ui-form-item--left-labelled'
        : 'cx-ui-form-item--top-labelled',
    );
  } else {
    cls.push('cx-ui-form-item--no-label');
  }
  return cls;
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

export interface ResolveFormLabelClassListInput {
  readonly showRequireMark: boolean;
  readonly labelAlign: FormLabelAlign;
}

export function resolveFormLabelClassList(input: ResolveFormLabelClassListInput): string[] {
  const cls = ['cx-ui-form-item-label'];
  if (input.showRequireMark) cls.push('cx-ui-form-item-label--required');
  if (input.labelAlign === 'center') cls.push('cx-ui-form-item-label--center');
  if (input.labelAlign === 'right') cls.push('cx-ui-form-item-label--right');
  return cls;
}

// ---------------------------------------------------------------------------
// Blank (content wrapper)
// ---------------------------------------------------------------------------

export interface ResolveFormBlankClassListInput {
  readonly hasError: boolean;
}

export function resolveFormBlankClassList(input: ResolveFormBlankClassListInput): string[] {
  const cls = ['cx-ui-form-item-blank'];
  if (input.hasError) cls.push('cx-ui-form-item-blank--error');
  return cls;
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export interface ResolveFormFeedbackClassListInput {
  readonly isError: boolean;
}

export function resolveFormFeedbackClassList(input: ResolveFormFeedbackClassListInput): string[] {
  const cls = ['cx-ui-form-item-feedback'];
  if (input.isError) cls.push('cx-ui-form-item-feedback--error');
  return cls;
}
