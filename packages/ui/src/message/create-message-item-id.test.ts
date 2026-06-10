import { describe, expect, it } from 'vitest';

import { createMessageItemId } from './create-message-item-id.js';

describe('createMessageItemId', () => {
  it('returns a non-empty string', () => {
    const id = createMessageItemId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('starts with the msg- prefix', () => {
    const id = createMessageItemId();
    expect(id).toMatch(/^msg-\d+$/);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) {
      ids.add(createMessageItemId());
    }
    expect(ids.size).toBe(20);
  });
});
