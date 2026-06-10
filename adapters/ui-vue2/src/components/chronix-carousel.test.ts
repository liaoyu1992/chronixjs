import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixCarousel } from './chronix-carousel.js';

const C = ChronixCarousel as unknown as VueConstructor;

const items = [
  { key: 'a', content: 'A body' },
  { key: 'b', content: 'B body' },
  { key: 'c', content: 'C body' },
] as const;

describe('ChronixCarousel (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders viewport + slides + dots + arrows', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items, value: 0 } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-carousel').exists()).toBe(true);
    expect(wrapper.findAll('.cx-ui-carousel__slide').length).toBe(3);
    expect(wrapper.findAll('.cx-ui-carousel__dot').length).toBe(3);
    expect(wrapper.findAll('.cx-ui-carousel__arrow').length).toBe(2);
  });

  it('marks active slide + dot with --active modifier', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items, value: 1 } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('[data-slide-key="b"]').classes()).toContain(
      'cx-ui-carousel__slide--active',
    );
    expect(wrapper.find('[data-dot-index="1"]').classes()).toContain('cx-ui-carousel__dot--active');
  });

  it('hides dots + arrows when configured', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items, value: 0, showDots: false, showArrows: false } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-carousel__dots').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-carousel__arrows').exists()).toBe(false);
  });

  it('injects the chronix-carousel stylesheet', () => {
    mount(C, { propsData: { items: [], value: 0 } });
    expect(document.head.querySelector('style[data-chronix-ui="carousel"]')).not.toBeNull();
  });
});
