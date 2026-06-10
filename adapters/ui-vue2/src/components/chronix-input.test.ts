import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixInput } from './chronix-input.js';

const C = ChronixInput as unknown as VueConstructor;

describe('ChronixInput (vue2)', () => {
  it('renders <div> root with base + --text + --medium for defaults', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-input');
    expect(wrapper.classes()).toContain('cx-ui-input--text');
    expect(wrapper.classes()).toContain('cx-ui-input--medium');
  });

  it('renders <textarea> inner when type=textarea', () => {
    const wrapper = mount(C, { propsData: { type: 'textarea' } });
    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.classes()).toContain('cx-ui-input--textarea');
  });

  it('shows clear button when clearable + value non-empty', () => {
    const wrapper = mount(C, {
      propsData: { clearable: true, value: 'hello' },
    });
    expect(wrapper.find('button.cx-ui-input__clear').exists()).toBe(true);
  });

  it('renders error row + --invalid when error is defined', () => {
    const wrapper = mount(C, { propsData: { error: 'oops' } });
    expect(wrapper.classes()).toContain('cx-ui-input--invalid');
    expect(wrapper.find('.cx-ui-input__error').text()).toBe('oops');
  });

  it('injects the chronix-input stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="input"]')).not.toBeNull();
  });
});
