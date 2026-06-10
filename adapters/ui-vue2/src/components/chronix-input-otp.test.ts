import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixInputOtp } from './chronix-input-otp.js';

const C = ChronixInputOtp as unknown as VueConstructor;

describe('ChronixInputOtp (vue2)', () => {
  it('renders <div> root with default length=6 cells', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.findAll('input.cx-ui-otp__cell')).toHaveLength(6);
  });

  it('renders custom length cells', () => {
    const wrapper = mount(C, { propsData: { length: 4 } });
    expect(wrapper.findAll('input.cx-ui-otp__cell')).toHaveLength(4);
  });

  it('renders error row + --invalid', () => {
    const wrapper = mount(C, { propsData: { error: 'bad' } });
    expect(wrapper.classes()).toContain('cx-ui-otp--invalid');
    expect(wrapper.find('.cx-ui-otp__error').text()).toBe('bad');
  });

  it('injects the chronix-input-otp stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="input-otp"]')).not.toBeNull();
  });
});
