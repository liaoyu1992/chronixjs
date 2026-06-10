import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixImage } from './chronix-image.js';

const C = ChronixImage as unknown as VueConstructor;

describe('ChronixImage (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an <img> with the given src + alt + objectFit inline', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { src: 'https://example.com/x.png', alt: 'pic', objectFit: 'contain' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const img = wrapper.find('img.cx-ui-image');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/x.png');
    expect(img.attributes('alt')).toBe('pic');
    expect((img.element as HTMLImageElement).style.objectFit).toBe('contain');
  });

  it('attaches loading="lazy" when lazy=true (default)', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { src: 'x' } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('img').attributes('loading')).toBe('lazy');
  });

  it('adds --previewable modifier when previewable=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { src: 'x', previewable: true } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('img').classes()).toContain('cx-ui-image--previewable');
  });

  it('falls back to fallback src after error event', async () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { src: 'primary.png', fallback: 'fb.png' } });
      },
    });
    const wrapper = mount(Wrapper);
    await wrapper.find('img').trigger('error');
    expect(wrapper.find('img').attributes('src')).toBe('fb.png');
    expect(wrapper.find('img').classes()).toContain('cx-ui-image--failed');
  });

  it('injects the chronix-image stylesheet', () => {
    mount(C, { propsData: { src: 'x' } });
    expect(document.head.querySelector('style[data-chronix-ui="image"]')).not.toBeNull();
  });
});
