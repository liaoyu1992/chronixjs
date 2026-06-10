import { describe, expect, it } from 'vitest';

import { defaultPopconfirmProps } from './popconfirm-spec.js';

describe('defaultPopconfirmProps', () => {
  it('matches defaults (click trigger / top placement / OK + Cancel button text)', () => {
    expect(defaultPopconfirmProps).toEqual({
      title: '',
      positiveText: 'OK',
      negativeText: 'Cancel',
      show: undefined,
      trigger: 'click',
      placement: 'top',
      offset: 4,
      flip: true,
      disabled: false,
    });
  });
});
