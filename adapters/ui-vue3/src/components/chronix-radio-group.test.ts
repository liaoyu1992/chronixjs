import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixRadioGroup } from './chronix-radio-group.js';

import type { RadioOption } from '@chronixjs/ui';

const OPTIONS: readonly RadioOption[] = [
  { key: 'a', label: 'Apple', value: 'a', disabled: false },
  { key: 'b', label: 'Banana', value: 'b', disabled: false },
  { key: 'c', label: 'Cherry', value: 'c', disabled: false },
];

describe('ChronixRadioGroup (vue3)', () => {
  it('renders <div role=radiogroup> with one radio per option', () => {
    const wrapper = mount(ChronixRadioGroup, { props: { options: OPTIONS } });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBe('radiogroup');
    expect(wrapper.findAll('label.cx-ui-radio')).toHaveLength(3);
  });

  it('marks selected radio with --checked', () => {
    const wrapper = mount(ChronixRadioGroup, {
      props: { options: OPTIONS, value: 'b' },
    });
    const radios = wrapper.findAll('label.cx-ui-radio');
    expect(radios[0]!.classes()).not.toContain('cx-ui-radio--checked');
    expect(radios[1]!.classes()).toContain('cx-ui-radio--checked');
  });

  it('emits update:value when a radio is clicked', async () => {
    const wrapper = mount(ChronixRadioGroup, { props: { options: OPTIONS } });
    await wrapper.findAll('label.cx-ui-radio')[1]!.trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['b']);
  });

  it('renders error row + --invalid', () => {
    const wrapper = mount(ChronixRadioGroup, {
      props: { options: OPTIONS, error: 'pick one' },
    });
    expect(wrapper.classes()).toContain('cx-ui-radio-group--invalid');
    expect(wrapper.find('.cx-ui-radio-group__error').text()).toBe('pick one');
  });

  it('injects the chronix-radio stylesheet', () => {
    mount(ChronixRadioGroup, { props: { options: OPTIONS } });
    expect(document.head.querySelector('style[data-chronix-ui="radio"]')).not.toBeNull();
  });
});
