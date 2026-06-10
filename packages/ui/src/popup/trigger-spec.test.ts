import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HOVER_ENTER_DELAY_MS,
  DEFAULT_HOVER_LEAVE_DELAY_MS,
  DEFAULT_POPUP_TRIGGER,
  type PopupTrigger,
} from './trigger-spec.js';

describe('PopupTrigger defaults', () => {
  it('exposes 4 trigger types', () => {
    const all: PopupTrigger[] = ['click', 'hover', 'focus', 'manual'];
    expect(all).toHaveLength(4);
  });

  it('default trigger is hover', () => {
    expect(DEFAULT_POPUP_TRIGGER).toBe('hover');
  });

  it('default hover-enter delay 100ms + hover-leave delay 200ms', () => {
    expect(DEFAULT_HOVER_ENTER_DELAY_MS).toBe(100);
    expect(DEFAULT_HOVER_LEAVE_DELAY_MS).toBe(200);
  });
});
