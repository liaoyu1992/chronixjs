import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixRadioGroup } from './chronix-radio-group.js';

import type { RadioOption } from '@chronixjs/ui';

const C = ChronixRadioGroup as unknown as VueConstructor;

const OPTIONS: readonly RadioOption[] = [
  { key: 'a', label: 'Apple', value: 'a', disabled: false },
  { key: 'b', label: 'Banana', value: 'b', disabled: false },
];

describe('ChronixRadioGroup (vue2)', () => {
  it('renders <div role=radiogroup> with one radio per option', () => {
    const wrapper = mount(C, { propsData: { options: OPTIONS } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBe('radiogroup');
    expect(wrapper.findAll('label.cx-ui-radio')).toHaveLength(2);
  });

  it('marks selected radio with --checked', () => {
    const wrapper = mount(C, { propsData: { options: OPTIONS, value: 'b' } });
    const radios = wrapper.findAll('label.cx-ui-radio');
    expect(radios.at(1).classes()).toContain('cx-ui-radio--checked');
  });

  it('renders error row + --invalid', () => {
    const wrapper = mount(C, {
      propsData: { options: OPTIONS, error: 'pick one' },
    });
    expect(wrapper.classes()).toContain('cx-ui-radio-group--invalid');
    expect(wrapper.find('.cx-ui-radio-group__error').text()).toBe('pick one');
  });

  it('injects the chronix-radio stylesheet', () => {
    mount(C, { propsData: { options: OPTIONS } });
    expect(document.head.querySelector('style[data-chronix-ui="radio"]')).not.toBeNull();
  });
});
