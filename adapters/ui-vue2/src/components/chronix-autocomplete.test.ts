import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixAutoComplete } from './chronix-autocomplete.js';

import type { AutoCompleteOption } from '@chronixjs/ui';

const C = ChronixAutoComplete as unknown as VueConstructor;

const OPTIONS: readonly AutoCompleteOption[] = [
  { key: 'a', label: 'Apple', value: 'apple' },
  { key: 'b', label: 'Banana', value: 'banana' },
  { key: 'c', label: 'apricot', value: 'apricot' },
];

describe('ChronixAutoComplete (vue2)', () => {
  it('renders <div> root with closed list by default', () => {
    const wrapper = mount(C, { propsData: { options: OPTIONS } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.find('.cx-ui-autocomplete__list').exists()).toBe(false);
  });

  it('opens list on input + filters by query', async () => {
    // Vue 2 vue-test-utils@1 trigger('focus') does not always propagate
    // through composition-api `on:` handlers in jsdom; use input which
    // also opens the list (per the adapter's onInput handler).
    const wrapper = mount(C, { propsData: { options: OPTIONS, value: 'ap' } });
    const input = wrapper.find('input');
    (input.element as HTMLInputElement).value = 'ap';
    await input.trigger('input');
    expect(wrapper.find('.cx-ui-autocomplete__list').exists()).toBe(true);
    expect(wrapper.findAll('.cx-ui-autocomplete__option')).toHaveLength(2);
  });

  it('renders error row + --invalid', () => {
    const wrapper = mount(C, {
      propsData: { options: OPTIONS, error: 'pick one' },
    });
    expect(wrapper.classes()).toContain('cx-ui-autocomplete--invalid');
    expect(wrapper.find('.cx-ui-autocomplete__error').text()).toBe('pick one');
  });

  it('injects the chronix-autocomplete stylesheet', () => {
    mount(C, { propsData: { options: OPTIONS } });
    expect(document.head.querySelector('style[data-chronix-ui="autocomplete"]')).not.toBeNull();
  });
});
