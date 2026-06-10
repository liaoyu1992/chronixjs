import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixInput } from './chronix-input.js';

describe('ChronixInput (vue3)', () => {
  it('renders <div> root with base + --text + --medium for defaults', () => {
    const wrapper = mount(ChronixInput);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-input');
    expect(wrapper.classes()).toContain('cx-ui-input--text');
    expect(wrapper.classes()).toContain('cx-ui-input--medium');
  });

  it('renders <textarea> inner when type=textarea', () => {
    const wrapper = mount(ChronixInput, { props: { type: 'textarea' } });
    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.classes()).toContain('cx-ui-input--textarea');
  });

  it('shows clear button when clearable + value non-empty', () => {
    const wrapper = mount(ChronixInput, {
      props: { clearable: true, value: 'hello' },
    });
    expect(wrapper.find('button.cx-ui-input__clear').exists()).toBe(true);
  });

  it('emits update:value on input', async () => {
    const wrapper = mount(ChronixInput);
    await wrapper.find('input').setValue('typed');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['typed']);
  });

  it('renders error row + --invalid when error is defined', () => {
    const wrapper = mount(ChronixInput, { props: { error: 'oops' } });
    expect(wrapper.classes()).toContain('cx-ui-input--invalid');
    expect(wrapper.find('.cx-ui-input__error').text()).toBe('oops');
  });

  it('injects the chronix-input stylesheet', () => {
    mount(ChronixInput);
    expect(document.head.querySelector('style[data-chronix-ui="input"]')).not.toBeNull();
  });
});
