// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getBodyScrollLockCountForTests,
  lockBodyScroll,
  resetBodyScrollLockForTests,
  unlockBodyScroll,
} from './body-scroll-lock.js';

describe('body-scroll-lock', () => {
  beforeEach(() => {
    resetBodyScrollLockForTests();
  });
  afterEach(() => {
    resetBodyScrollLockForTests();
  });

  it('sets body.overflow=hidden on first lock and restores on last unlock', () => {
    document.body.style.overflow = 'auto';
    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('keeps overflow=hidden while at least one lock is held (stack-aware)', () => {
    lockBodyScroll();
    lockBodyScroll();
    lockBodyScroll();
    expect(getBodyScrollLockCountForTests()).toBe(3);
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll();
    expect(getBodyScrollLockCountForTests()).toBe(2);
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll();
    expect(getBodyScrollLockCountForTests()).toBe(1);
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll();
    expect(getBodyScrollLockCountForTests()).toBe(0);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores empty overflow when no inline overflow was set initially', () => {
    document.body.style.overflow = '';
    lockBodyScroll();
    unlockBodyScroll();
    expect(document.body.style.overflow).toBe('');
  });

  it('clamps unlock at zero (extra unlock is a no-op)', () => {
    lockBodyScroll();
    unlockBodyScroll();
    expect(getBodyScrollLockCountForTests()).toBe(0);
    // Extra unlock — should not throw or go negative.
    unlockBodyScroll();
    expect(getBodyScrollLockCountForTests()).toBe(0);
  });

  it('reset helper clears counter + body overflow', () => {
    lockBodyScroll();
    lockBodyScroll();
    expect(getBodyScrollLockCountForTests()).toBe(2);
    resetBodyScrollLockForTests();
    expect(getBodyScrollLockCountForTests()).toBe(0);
    expect(document.body.style.overflow).toBe('');
  });
});
