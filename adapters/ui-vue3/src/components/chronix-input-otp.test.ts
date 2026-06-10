import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixInputOtp } from './chronix-input-otp.js';

describe('ChronixInputOtp (vue3)', () => {
  it('renders <div> root with default length=6 cells', () => {
    const wrapper = mount(ChronixInputOtp);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.findAll('input.cx-ui-otp__cell')).toHaveLength(6);
  });

  it('renders custom length cells', () => {
    const wrapper = mount(ChronixInputOtp, { props: { length: 4 } });
    expect(wrapper.findAll('input.cx-ui-otp__cell')).toHaveLength(4);
  });

  it('populates cells from value', () => {
    const wrapper = mount(ChronixInputOtp, {
      props: { value: '12', length: 4 },
    });
    const cells = wrapper.findAll<HTMLInputElement>('input.cx-ui-otp__cell');
    expect(cells[0]!.element.value).toBe('1');
    expect(cells[1]!.element.value).toBe('2');
    expect(cells[2]!.element.value).toBe('');
  });

  it('renders error row + --invalid when error is defined', () => {
    const wrapper = mount(ChronixInputOtp, { props: { error: 'bad' } });
    expect(wrapper.classes()).toContain('cx-ui-otp--invalid');
    expect(wrapper.find('.cx-ui-otp__error').text()).toBe('bad');
  });

  it('injects the chronix-input-otp stylesheet', () => {
    mount(ChronixInputOtp);
    expect(document.head.querySelector('style[data-chronix-ui="input-otp"]')).not.toBeNull();
  });
});
