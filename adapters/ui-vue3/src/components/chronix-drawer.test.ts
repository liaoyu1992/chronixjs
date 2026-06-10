import { resetBodyScrollLockForTests, resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixDrawer } from './chronix-drawer.js';

describe('ChronixDrawer (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
    resetBodyScrollLockForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders nothing in the portal when show=false', () => {
    mount(ChronixDrawer, {
      attachTo: document.body,
      props: { show: false },
      slots: { default: () => 'x' },
    });
    expect(document.querySelector('.cx-ui-drawer')).toBeNull();
  });

  it('teleports panel + applies --placement-right (default)', () => {
    mount(ChronixDrawer, {
      attachTo: document.body,
      props: { show: true },
      slots: { default: () => 'x' },
    });
    const panel = document.querySelector('.cx-ui-drawer');
    expect(panel).not.toBeNull();
    expect(panel!.classList.contains('cx-ui-drawer--placement-right')).toBe(true);
  });

  it('applies width via inline style for horizontal placement', () => {
    mount(ChronixDrawer, {
      attachTo: document.body,
      props: { show: true, placement: 'left', width: 320 },
      slots: { default: () => 'x' },
    });
    const panel = document.querySelector<HTMLElement>('.cx-ui-drawer');
    expect(panel!.style.width).toBe('320px');
  });

  it('applies height via inline style for vertical placement', () => {
    mount(ChronixDrawer, {
      attachTo: document.body,
      props: { show: true, placement: 'top', height: 240 },
      slots: { default: () => 'x' },
    });
    const panel = document.querySelector<HTMLElement>('.cx-ui-drawer');
    expect(panel!.style.height).toBe('240px');
  });

  it('injects the chronix-drawer stylesheet', () => {
    mount(ChronixDrawer, {
      attachTo: document.body,
      slots: { default: () => 'x' },
    });
    expect(document.head.querySelector('style[data-chronix-ui="drawer"]')).not.toBeNull();
  });
});
