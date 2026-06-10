import { describe, expect, it } from 'vitest';

import { defaultModalProps, resolveModalWidthStyle } from './modal-spec.js';

describe('defaultModalProps', () => {
  it('matches defaults (uncontrolled / mask on / closables on / width 520)', () => {
    expect(defaultModalProps).toEqual({
      show: undefined,
      title: undefined,
      mask: true,
      maskClosable: true,
      escClosable: true,
      width: 520,
      disabled: false,
    });
  });
});

describe('resolveModalWidthStyle', () => {
  it('appends px to numeric width', () => {
    expect(resolveModalWidthStyle(520)).toBe('520px');
    expect(resolveModalWidthStyle(0)).toBe('0px');
  });
  it('passes string width through verbatim', () => {
    expect(resolveModalWidthStyle('80%')).toBe('80%');
    expect(resolveModalWidthStyle('40rem')).toBe('40rem');
  });
});
