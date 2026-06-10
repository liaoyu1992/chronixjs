import { resetBodyScrollLockForTests, resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixModal } from './chronix-modal.js';

describe('ChronixModal (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
    resetBodyScrollLockForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders nothing in the portal when show=false', () => {
    mount(ChronixModal, {
      attachTo: document.body,
      props: { show: false },
      slots: { default: () => 'Body' },
    });
    expect(document.querySelector('.cx-ui-modal')).toBeNull();
  });

  it('teleports wrapper + panel into document.body when show=true', () => {
    mount(ChronixModal, {
      attachTo: document.body,
      props: { show: true, title: 'Hello' },
      slots: { default: () => 'Body content' },
    });
    const wrapper = document.querySelector('.cx-ui-modal-wrapper');
    expect(wrapper).not.toBeNull();
    expect(wrapper!.classList.contains('cx-ui-modal-wrapper--with-mask')).toBe(true);
    const panel = document.querySelector('.cx-ui-modal');
    expect(panel).not.toBeNull();
    expect(panel!.querySelector('.cx-ui-modal__title')?.textContent).toBe('Hello');
  });

  it('omits mask when mask=false', () => {
    mount(ChronixModal, {
      attachTo: document.body,
      props: { show: true, mask: false },
      slots: { default: () => 'x' },
    });
    expect(document.querySelector('.cx-ui-modal__mask')).toBeNull();
    expect(
      document
        .querySelector('.cx-ui-modal-wrapper')
        ?.classList.contains('cx-ui-modal-wrapper--with-mask'),
    ).toBe(false);
  });

  it('renders footer slot when provided', () => {
    mount(ChronixModal, {
      attachTo: document.body,
      props: { show: true },
      slots: { default: () => 'body', footer: () => 'F' },
    });
    expect(document.querySelector('.cx-ui-modal__footer')?.textContent).toContain('F');
  });

  it('applies width via inline style', () => {
    mount(ChronixModal, {
      attachTo: document.body,
      props: { show: true, width: '640px' },
      slots: { default: () => 'x' },
    });
    const panel = document.querySelector<HTMLElement>('.cx-ui-modal');
    expect(panel!.style.width).toBe('640px');
  });

  it('injects the chronix-modal stylesheet', () => {
    mount(ChronixModal, {
      attachTo: document.body,
      slots: { default: () => 'x' },
    });
    expect(document.head.querySelector('style[data-chronix-ui="modal"]')).not.toBeNull();
  });
});
