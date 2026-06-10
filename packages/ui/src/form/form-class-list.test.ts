import { describe, expect, it } from 'vitest';

import {
  resolveFormBlankClassList,
  resolveFormClassList,
  resolveFormFeedbackClassList,
  resolveFormItemClassList,
  resolveFormLabelClassList,
} from './resolve-form-class-list.js';

// ---------------------------------------------------------------------------
// ChronixForm root
// ---------------------------------------------------------------------------

describe('resolveFormClassList', () => {
  it('returns base class for top-label non-inline', () => {
    const cls = resolveFormClassList({ inline: false, labelPlacement: 'top' });
    expect(cls).toEqual(['cx-ui-form', 'cx-ui-form--top-label']);
  });

  it('includes left-label modifier', () => {
    const cls = resolveFormClassList({ inline: false, labelPlacement: 'left' });
    expect(cls).toContain('cx-ui-form--left-label');
  });

  it('includes inline modifier', () => {
    const cls = resolveFormClassList({ inline: true, labelPlacement: 'top' });
    expect(cls).toContain('cx-ui-form--inline');
  });
});

// ---------------------------------------------------------------------------
// ChronixFormItem
// ---------------------------------------------------------------------------

describe('resolveFormItemClassList', () => {
  it('returns base + size + top-labelled when has label', () => {
    const cls = resolveFormItemClassList({
      size: 'medium',
      labelPlacement: 'top',
      hasLabel: true,
      hasError: false,
    });
    expect(cls).toContain('cx-ui-form-item');
    expect(cls).toContain('cx-ui-form-item--medium-size');
    expect(cls).toContain('cx-ui-form-item--top-labelled');
  });

  it('includes left-labelled for left placement', () => {
    const cls = resolveFormItemClassList({
      size: 'small',
      labelPlacement: 'left',
      hasLabel: true,
      hasError: false,
    });
    expect(cls).toContain('cx-ui-form-item--left-labelled');
  });

  it('includes no-label when label is absent', () => {
    const cls = resolveFormItemClassList({
      size: 'medium',
      labelPlacement: 'top',
      hasLabel: false,
      hasError: false,
    });
    expect(cls).toContain('cx-ui-form-item--no-label');
  });

  it('includes all sizes', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      const cls = resolveFormItemClassList({
        size,
        labelPlacement: 'top',
        hasLabel: true,
        hasError: false,
      });
      expect(cls).toContain(`cx-ui-form-item--${size}-size`);
    }
  });
});

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

describe('resolveFormLabelClassList', () => {
  it('returns base class without modifiers', () => {
    const cls = resolveFormLabelClassList({ showRequireMark: false, labelAlign: 'left' });
    expect(cls).toEqual(['cx-ui-form-item-label']);
  });

  it('includes required modifier', () => {
    const cls = resolveFormLabelClassList({ showRequireMark: true, labelAlign: 'left' });
    expect(cls).toContain('cx-ui-form-item-label--required');
  });

  it('includes center modifier', () => {
    const cls = resolveFormLabelClassList({ showRequireMark: false, labelAlign: 'center' });
    expect(cls).toContain('cx-ui-form-item-label--center');
  });

  it('includes right modifier', () => {
    const cls = resolveFormLabelClassList({ showRequireMark: false, labelAlign: 'right' });
    expect(cls).toContain('cx-ui-form-item-label--right');
  });
});

// ---------------------------------------------------------------------------
// Blank
// ---------------------------------------------------------------------------

describe('resolveFormBlankClassList', () => {
  it('returns base only when no error', () => {
    expect(resolveFormBlankClassList({ hasError: false })).toEqual(['cx-ui-form-item-blank']);
  });

  it('includes error modifier', () => {
    expect(resolveFormBlankClassList({ hasError: true })).toContain('cx-ui-form-item-blank--error');
  });
});

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

describe('resolveFormFeedbackClassList', () => {
  it('returns base only when not error', () => {
    expect(resolveFormFeedbackClassList({ isError: false })).toEqual(['cx-ui-form-item-feedback']);
  });

  it('includes error modifier', () => {
    expect(resolveFormFeedbackClassList({ isError: true })).toContain(
      'cx-ui-form-item-feedback--error',
    );
  });
});
