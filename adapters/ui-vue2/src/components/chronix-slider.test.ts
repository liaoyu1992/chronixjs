import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixSlider } from './chronix-slider.js';

import type { VueConstructor } from 'vue';

const SliderCtor = ChronixSlider as unknown as VueConstructor;

describe('ChronixSlider (Vue 2)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(SliderCtor, { propsData: { value: 50 } });
    expect(wrapper.find('.cx-ui-slider').exists()).toBe(true);
    expect(wrapper.find('[data-testid="slider-root"]').exists()).toBe(true);
  });

  it('renders track and thumb', () => {
    const wrapper = mount(SliderCtor, { propsData: { value: 50 } });
    expect(wrapper.find('[data-testid="slider-track"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="slider-thumb"]').exists()).toBe(true);
  });

  it('renders second thumb in range mode', () => {
    const wrapper = mount(SliderCtor, { propsData: { value: [20, 80], range: true } });
    expect(wrapper.find('[data-testid="slider-thumb"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="slider-thumb-2"]').exists()).toBe(true);
  });

  it('injects the chronix-slider stylesheet', () => {
    mount(SliderCtor, { propsData: { value: 50 } });
    const style = document.head.querySelector('style[data-chronix-ui="slider"]');
    expect(style).not.toBeNull();
  });
});
