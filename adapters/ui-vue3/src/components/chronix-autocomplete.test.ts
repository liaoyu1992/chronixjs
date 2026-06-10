import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixAutoComplete } from './chronix-autocomplete.js';

import type { AutoCompleteOption } from '@chronixjs/ui';

const OPTIONS: readonly AutoCompleteOption[] = [
  { key: 'a', label: 'Apple', value: 'apple' },
  { key: 'b', label: 'Banana', value: 'banana' },
  { key: 'c', label: 'apricot', value: 'apricot' },
];

describe('ChronixAutoComplete (vue3)', () => {
  it('renders <div> root with closed list by default', () => {
    const wrapper = mount(ChronixAutoComplete, { props: { options: OPTIONS } });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.find('.cx-ui-autocomplete__list').exists()).toBe(false);
  });

  it('opens list on focus + filters by query', async () => {
    const wrapper = mount(ChronixAutoComplete, {
      props: { options: OPTIONS, value: 'ap' },
    });
    await wrapper.find('input').trigger('focus');
    expect(wrapper.find('.cx-ui-autocomplete__list').exists()).toBe(true);
    expect(wrapper.findAll('.cx-ui-autocomplete__option')).toHaveLength(2);
  });

  it('emits select + update:value on option mousedown', async () => {
    const wrapper = mount(ChronixAutoComplete, {
      props: { options: OPTIONS, value: 'ap' },
    });
    await wrapper.find('input').trigger('focus');
    const options = wrapper.findAll('.cx-ui-autocomplete__option');
    await options[0]!.trigger('mousedown');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['apple']);
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({
      key: 'a',
      value: 'apple',
    });
  });

  it('renders error row + --invalid', () => {
    const wrapper = mount(ChronixAutoComplete, {
      props: { options: OPTIONS, error: 'pick one' },
    });
    expect(wrapper.classes()).toContain('cx-ui-autocomplete--invalid');
    expect(wrapper.find('.cx-ui-autocomplete__error').text()).toBe('pick one');
  });

  it('injects the chronix-autocomplete stylesheet', () => {
    mount(ChronixAutoComplete, { props: { options: OPTIONS } });
    expect(document.head.querySelector('style[data-chronix-ui="autocomplete"]')).not.toBeNull();
  });
});
