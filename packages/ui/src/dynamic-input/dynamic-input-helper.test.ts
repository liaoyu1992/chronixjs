import { describe, expect, it } from 'vitest';

import { createDynamicInputItem } from './dynamic-input-helper.js';

describe('createDynamicInputItem', () => {
  it('returns empty string for any index', () => {
    expect(createDynamicInputItem(0)).toBe('');
    expect(createDynamicInputItem(5)).toBe('');
  });
});
