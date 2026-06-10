import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixInputNumber } from './chronix-input-number.js';

describe('ChronixInputNumber (vue3)', () => {
  it('renders <div> root with __decrement + __input + __increment', () => {
    const wrapper = mount(ChronixInputNumber);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.find('.cx-ui-input-number__decrement').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-input-number__input').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-input-number__increment').exists()).toBe(true);
  });

  it('inner stepper buttons are type=button', () => {
    const wrapper = mount(ChronixInputNumber);
    expect(wrapper.find('button.cx-ui-input-number__decrement').attributes('type')).toBe('button');
    expect(wrapper.find('button.cx-ui-input-number__increment').attributes('type')).toBe('button');
  });

  it('emits update:value on increment click with step', async () => {
    const wrapper = mount(ChronixInputNumber, {
      props: { value: 5, step: 2 },
    });
    await wrapper.find('button.cx-ui-input-number__increment').trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual([7]);
  });

  it('clamps to max on increment', async () => {
    const wrapper = mount(ChronixInputNumber, {
      props: { value: 9, max: 10, step: 5 },
    });
    await wrapper.find('button.cx-ui-input-number__increment').trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual([10]);
  });

  it('renders error row + --invalid', () => {
    const wrapper = mount(ChronixInputNumber, { props: { error: 'too big' } });
    expect(wrapper.classes()).toContain('cx-ui-input-number--invalid');
    expect(wrapper.find('.cx-ui-input-number__error').text()).toBe('too big');
  });

  it('injects the chronix-input-number stylesheet', () => {
    mount(ChronixInputNumber);
    expect(document.head.querySelector('style[data-chronix-ui="input-number"]')).not.toBeNull();
  });
});
