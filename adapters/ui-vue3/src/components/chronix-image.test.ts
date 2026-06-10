import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixImage } from './chronix-image.js';

describe('ChronixImage (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an <img> with the given src + alt + objectFit inline', () => {
    const wrapper = mount(ChronixImage, {
      props: { src: 'https://example.com/x.png', alt: 'pic', objectFit: 'contain' },
    });
    const img = wrapper.find('img.cx-ui-image');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/x.png');
    expect(img.attributes('alt')).toBe('pic');
    expect((img.element as HTMLImageElement).style.objectFit).toBe('contain');
  });

  it('attaches loading="lazy" when lazy=true (default)', () => {
    const wrapper = mount(ChronixImage, { props: { src: 'x' } });
    expect(wrapper.find('img').attributes('loading')).toBe('lazy');
  });

  it('omits loading attribute when lazy=false', () => {
    const wrapper = mount(ChronixImage, { props: { src: 'x', lazy: false } });
    expect(wrapper.find('img').attributes('loading')).toBeUndefined();
  });

  it('adds --previewable modifier when previewable=true', () => {
    const wrapper = mount(ChronixImage, { props: { src: 'x', previewable: true } });
    expect(wrapper.find('img').classes()).toContain('cx-ui-image--previewable');
  });

  it('falls back to fallback src after error event', async () => {
    const wrapper = mount(ChronixImage, {
      props: { src: 'primary.png', fallback: 'fb.png' },
    });
    await wrapper.find('img').trigger('error');
    expect(wrapper.find('img').attributes('src')).toBe('fb.png');
    expect(wrapper.find('img').classes()).toContain('cx-ui-image--failed');
  });

  it('injects the chronix-image stylesheet', () => {
    mount(ChronixImage, { props: { src: 'x' } });
    expect(document.head.querySelector('style[data-chronix-ui="image"]')).not.toBeNull();
  });
});
