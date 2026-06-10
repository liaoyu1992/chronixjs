import { beforeEach, describe, expect, it } from 'vitest';

import { nextPopupZIndex, resetPopupZIndexForTests } from './z-index-counter.js';

describe('nextPopupZIndex', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });

  it('returns 1000 on first call after reset', () => {
    expect(nextPopupZIndex()).toBe(1000);
  });

  it('increments monotonically across calls', () => {
    expect(nextPopupZIndex()).toBe(1000);
    expect(nextPopupZIndex()).toBe(1001);
    expect(nextPopupZIndex()).toBe(1002);
  });

  it('keeps incrementing across many calls (no overflow within test scope)', () => {
    for (let i = 0; i < 100; i++) nextPopupZIndex();
    expect(nextPopupZIndex()).toBe(1100);
  });

  it('resetPopupZIndexForTests rewinds to 1000', () => {
    nextPopupZIndex();
    nextPopupZIndex();
    resetPopupZIndexForTests();
    expect(nextPopupZIndex()).toBe(1000);
  });
});
