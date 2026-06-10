import { describe, expect, it } from 'vitest';

import { createDialogItemId } from './create-dialog-item-id.js';

describe('createDialogItemId', () => {
  it('returns a non-empty string', () => {
    const id = createDialogItemId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('starts with the dlg- prefix', () => {
    const id = createDialogItemId();
    expect(id).toMatch(/^dlg-\d+$/);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) {
      ids.add(createDialogItemId());
    }
    expect(ids.size).toBe(20);
  });
});
