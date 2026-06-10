import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixRate } from './chronix-rate.js';

const C = ChronixRate as unknown as VueConstructor;

describe('ChronixRate (vue2)', () => {
  it('renders <div> + 5 default stars', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.findAll('button.cx-ui-rate__star')).toHaveLength(5);
  });

  it('marks --full / --empty per value=3', () => {
    const wrapper = mount(C, { propsData: { value: 3 } });
    const stars = wrapper.findAll('button.cx-ui-rate__star');
    expect(stars.at(0).classes()).toContain('cx-ui-rate__star--full');
    expect(stars.at(3).classes()).toContain('cx-ui-rate__star--empty');
  });

  it('shows --half when allowHalf + value=2.5', () => {
    const wrapper = mount(C, { propsData: { value: 2.5, allowHalf: true } });
    expect(wrapper.findAll('button.cx-ui-rate__star').at(2).classes()).toContain(
      'cx-ui-rate__star--half',
    );
  });

  it('injects the chronix-rate stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="rate"]')).not.toBeNull();
  });
});
