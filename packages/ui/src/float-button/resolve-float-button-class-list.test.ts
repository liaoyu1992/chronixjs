import { describe, expect, it } from 'vitest';

import { resolveFloatButtonClassList } from './resolve-float-button-class-list.js';

describe('resolveFloatButtonClassList', () => {
  it('emits 3 classes (base + shape + type) — circle/default', () => {
    expect(resolveFloatButtonClassList({ shape: 'circle', type: 'default' })).toEqual([
      'cx-ui-float-button',
      'cx-ui-float-button--shape-circle',
      'cx-ui-float-button--type-default',
    ]);
  });

  it('square + primary swap modifier suffixes', () => {
    expect(resolveFloatButtonClassList({ shape: 'square', type: 'primary' })).toEqual([
      'cx-ui-float-button',
      'cx-ui-float-button--shape-square',
      'cx-ui-float-button--type-primary',
    ]);
  });
});
