import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixInputNumber } from './chronix-input-number.js';

const C = ChronixInputNumber as unknown as VueConstructor;

describe('ChronixInputNumber (vue2)', () => {
  it('renders <div> root with stepper + input', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.find('.cx-ui-input-number__decrement').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-input-number__input').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-input-number__increment').exists()).toBe(true);
  });

  it('stepper buttons are type=button', () => {
    const wrapper = mount(C);
    expect(wrapper.find('button.cx-ui-input-number__decrement').attributes('type')).toBe('button');
  });

  it('emits update:value on increment with step', async () => {
    const wrapper = mount(C, { propsData: { value: 5, step: 2 } });
    await wrapper.find('button.cx-ui-input-number__increment').trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual([7]);
  });

  it('renders error row + --invalid', () => {
    const wrapper = mount(C, { propsData: { error: 'too big' } });
    expect(wrapper.classes()).toContain('cx-ui-input-number--invalid');
    expect(wrapper.find('.cx-ui-input-number__error').text()).toBe('too big');
  });

  it('injects the chronix-input-number stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="input-number"]')).not.toBeNull();
  });
});
