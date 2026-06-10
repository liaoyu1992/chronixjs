import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixBackTop } from './chronix-back-top.js';

describe('ChronixBackTop (vue3)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders nothing when scrollY below threshold', () => {
    const wrapper = mount(ChronixBackTop, {
      attachTo: document.body,
      props: { visibilityThreshold: 100 },
    });
    expect((wrapper.element as HTMLElement).nodeType).toBe(Node.COMMENT_NODE);
  });

  it('renders <button> when scrollY at or above threshold', async () => {
    (window as unknown as { scrollY: number }).scrollY = 500;
    const wrapper = mount(ChronixBackTop, {
      attachTo: document.body,
      props: { visibilityThreshold: 100 },
    });
    await wrapper.vm.$nextTick();
    expect((wrapper.element as HTMLElement).tagName).toBe('BUTTON');
    expect(wrapper.classes()).toContain('cx-ui-back-top');
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('applies right + bottom inline styles', async () => {
    (window as unknown as { scrollY: number }).scrollY = 500;
    const wrapper = mount(ChronixBackTop, {
      attachTo: document.body,
      props: { visibilityThreshold: 100, right: 24, bottom: 24 },
    });
    await wrapper.vm.$nextTick();
    const el = wrapper.element as HTMLElement;
    expect(el.style.right).toBe('24px');
    expect(el.style.bottom).toBe('24px');
  });

  it('emits click on button click', async () => {
    (window as unknown as { scrollY: number }).scrollY = 500;
    const wrapper = mount(ChronixBackTop, {
      attachTo: document.body,
      props: { visibilityThreshold: 100 },
    });
    await wrapper.vm.$nextTick();
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('injects the chronix-back-top stylesheet', () => {
    mount(ChronixBackTop, { attachTo: document.body });
    expect(document.head.querySelector('style[data-chronix-ui="back-top"]')).not.toBeNull();
  });
});
