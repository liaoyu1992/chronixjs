import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixCarousel } from './chronix-carousel.js';

const items = [
  { key: 'a', content: 'A body' },
  { key: 'b', content: 'B body' },
  { key: 'c', content: 'C body' },
] as const;

describe('ChronixCarousel (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders viewport + slides + dots + arrows', () => {
    const wrapper = mount(ChronixCarousel, { props: { items, value: 0 } });
    expect(wrapper.find('.cx-ui-carousel').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-carousel__viewport').exists()).toBe(true);
    expect(wrapper.findAll('.cx-ui-carousel__slide').length).toBe(3);
    expect(wrapper.findAll('.cx-ui-carousel__dot').length).toBe(3);
    expect(wrapper.findAll('.cx-ui-carousel__arrow').length).toBe(2);
  });

  it('marks the active slide + dot with --active modifier', () => {
    const wrapper = mount(ChronixCarousel, { props: { items, value: 1 } });
    expect(wrapper.find('[data-slide-key="b"]').classes()).toContain(
      'cx-ui-carousel__slide--active',
    );
    expect(wrapper.find('[data-dot-index="1"]').classes()).toContain('cx-ui-carousel__dot--active');
  });

  it('emits update:value on dot click', async () => {
    const wrapper = mount(ChronixCarousel, { props: { items, value: 0 } });
    await wrapper.find('[data-dot-index="2"]').trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual([2]);
  });

  it('hides dots + arrows when configured', () => {
    const wrapper = mount(ChronixCarousel, {
      props: { items, value: 0, showDots: false, showArrows: false },
    });
    expect(wrapper.find('.cx-ui-carousel__dots').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-carousel__arrows').exists()).toBe(false);
  });

  it('injects the chronix-carousel stylesheet', () => {
    mount(ChronixCarousel, { props: { items: [], value: 0 } });
    expect(document.head.querySelector('style[data-chronix-ui="carousel"]')).not.toBeNull();
  });
});
