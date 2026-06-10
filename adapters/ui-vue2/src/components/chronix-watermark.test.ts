import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixWatermark } from './chronix-watermark.js';

const Watermark = ChronixWatermark as unknown as VueConstructor;

describe('ChronixWatermark (vue2) — root rendering', () => {
  it('renders a <div> with the base class', () => {
    const wrapper = mount(Watermark);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-watermark');
  });

  it('renders a __content child', () => {
    const wrapper = mount(Watermark);
    expect(wrapper.find('.cx-ui-watermark__content').exists()).toBe(true);
  });

  it('renders the default slot inside __content', () => {
    const wrapper = mount(Watermark, {
      slots: { default: '<p data-testid="inner">Hello</p>' },
    });
    expect(wrapper.find('.cx-ui-watermark__content [data-testid="inner"]').text()).toBe('Hello');
  });
});

describe('ChronixWatermark (vue2) — inline style', () => {
  it('emits background-image with a SVG data URL', () => {
    const wrapper = mount(Watermark, { propsData: { content: 'DRAFT' } });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toContain('background-image');
    expect(style).toContain('data:image/svg+xml');
  });

  it('emits background-size matching width / height props', () => {
    const wrapper = mount(Watermark, {
      propsData: { width: 300, height: 100 },
    });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toContain('background-size');
    expect(style).toContain('300px');
    expect(style).toContain('100px');
  });

  it('changes background-image when content prop changes', async () => {
    const wrapper = mount(Watermark, { propsData: { content: 'A' } });
    const styleA = wrapper.attributes('style') ?? '';
    await wrapper.setProps({ content: 'B' });
    const styleB = wrapper.attributes('style') ?? '';
    expect(styleA).not.toBe(styleB);
  });
});

describe('ChronixWatermark (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-watermark stylesheet is in document.head', () => {
    mount(Watermark);
    expect(document.head.querySelector('style[data-chronix-ui="watermark"]')).not.toBeNull();
  });
});
