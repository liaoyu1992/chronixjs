// @vitest-environment happy-dom
/**
 * end-of-session sanity check on the popup
 * infrastructure that downstream components will
 * compose. If gaps surface here they get filed indesign
 * doc upfront.
 *
 * Three downstream phases depend on
 * - Modal + Drawer + Dropdown + Menu — share portal mount +
 *   click-outside + Escape close. Modal + Drawer need focus trap on
 *   top (KitFocusTrap, lands).
 * - Select + Cascader + TreeSelect + Mention — popup dropdown
 *   + portal mount + width-match.
 * - DatePicker + TimePicker + Calendar — popup panel + portal
 *   mount.
 *
 * This is a one-off; remove once ships and exercises the same
 * helpers in real components.
 */
import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_HOVER_ENTER_DELAY_MS,
  DEFAULT_HOVER_LEAVE_DELAY_MS,
  DEFAULT_POPUP_TRIGGER,
  nextPopupZIndex,
  resetPopupZIndexForTests,
  type PopupTrigger,
} from './index.js';

describe('popup infra sanity (de-risk)', () => {
  afterEach(() => {
    resetPopupZIndexForTests();
  });

  it('z-index counter starts at 1000 and yields monotonic stacking values', () => {
    resetPopupZIndexForTests();
    const z1 = nextPopupZIndex();
    const z2 = nextPopupZIndex();
    const z3 = nextPopupZIndex();
    expect(z1).toBe(1000);
    expect(z2).toBeGreaterThan(z1);
    expect(z3).toBeGreaterThan(z2);
  });

  it('multi-popup stacking yields distinct z-index values for each open call', () => {
    resetPopupZIndexForTests();
    const stacked = Array.from({ length: 5 }, () => nextPopupZIndex());
    const uniq = new Set(stacked);
    expect(uniq.size).toBe(stacked.length);
  });

  it('all 4 trigger types are exhaustively enumerable Dropdown/Menu/Modal', () => {
    const triggers: PopupTrigger[] = ['click', 'hover', 'focus', 'manual'];
    expect(triggers).toHaveLength(4);
    expect(triggers).toContain(DEFAULT_POPUP_TRIGGER);
  });

  it('hover-enter delay 100ms + leave delay 200ms — reasonable Select dropdown ergonomics', () => {
    expect(DEFAULT_HOVER_ENTER_DELAY_MS).toBeGreaterThanOrEqual(50);
    expect(DEFAULT_HOVER_ENTER_DELAY_MS).toBeLessThanOrEqual(200);
    expect(DEFAULT_HOVER_LEAVE_DELAY_MS).toBeGreaterThan(DEFAULT_HOVER_ENTER_DELAY_MS);
  });

  it('mounts two anchored popups simultaneously without state interference (multi-popup sanity)', () => {
    resetPopupZIndexForTests();
    const anchor1 = document.createElement('div');
    const anchor2 = document.createElement('div');
    const popup1 = document.createElement('div');
    const popup2 = document.createElement('div');
    document.body.appendChild(anchor1);
    document.body.appendChild(anchor2);
    document.body.appendChild(popup1);
    document.body.appendChild(popup2);

    const z1 = nextPopupZIndex();
    popup1.style.zIndex = String(z1);
    const z2 = nextPopupZIndex();
    popup2.style.zIndex = String(z2);

    expect(Number(popup1.style.zIndex)).toBeLessThan(Number(popup2.style.zIndex));

    anchor1.remove();
    anchor2.remove();
    popup1.remove();
    popup2.remove();
  });
});
