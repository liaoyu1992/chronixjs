import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixIconWrapper } from './chronix-icon-wrapper.js';

describe('ChronixIconWrapper (vue3)', () => {
  it('renders <span> with base class + inline width/height style', () => {
    const wrapper = mount(ChronixIconWrapper, { props: { size: 32 } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-icon-wrapper');
    const el = wrapper.element as HTMLElement;
    expect(el.style.width).toBe('32px');
    expect(el.style.height).toBe('32px');
  });

  it('sets inline color when color prop is defined', () => {
    const wrapper = mount(ChronixIconWrapper, { props: { color: '#ff0000' } });
    const el = wrapper.element as HTMLElement;
    // happy-dom keeps hex literal; chromium normalizes to rgb().
    expect(el.style.color.toLowerCase()).toMatch(/#ff0000|rgb\(255,\s*0,\s*0\)/);
  });

  it('renders default slot children', () => {
    const wrapper = mount(ChronixIconWrapper, {
      slots: { default: '<svg class="x"></svg>' },
    });
    expect(wrapper.find('.x').exists()).toBe(true);
  });

  it('injects the chronix-icon-wrapper stylesheet', () => {
    mount(ChronixIconWrapper);
    expect(document.head.querySelector('style[data-chronix-ui="icon-wrapper"]')).not.toBeNull();
  });
});
