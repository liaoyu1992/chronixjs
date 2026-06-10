import { describe, expect, it } from 'vitest';

import { createNotificationItemId } from './create-notification-item-id.js';

describe('createNotificationItemId', () => {
  it('returns a non-empty string', () => {
    const id = createNotificationItemId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('starts with the notif- prefix', () => {
    const id = createNotificationItemId();
    expect(id).toMatch(/^notif-\d+$/);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) {
      ids.add(createNotificationItemId());
    }
    expect(ids.size).toBe(20);
  });
});
