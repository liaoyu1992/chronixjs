import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixSelect } from './chronix-select.js';

import type { VueConstructor } from 'vue';

const C = ChronixSelect as unknown as VueConstructor;

const OPTS: readonly SelectOption[] = [
  { key: 'a', label: 'Apple', value: 'a' },
  { key: 'b', label: 'Banana', value: 'b' },
  { key: 'c', label: 'Cherry', value: 'c', disabled: true },
];

describe('ChronixSelect (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root with data-testid select-root', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: OPTS },
    });
    expect(wrapper.find('[data-testid="select-root"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('shows options when show=true', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: OPTS, show: true },
    });
    const dropdown = document.querySelector('[data-testid="select-dropdown-popup"]');
    expect(dropdown).not.toBeNull();
    const options = dropdown!.querySelectorAll('.cx-ui-select__option');
    expect(options).toHaveLength(3);
    wrapper.destroy();
  });

  it('emits update:value on option click', async () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: OPTS, show: true },
    });
    const option = document.querySelector('[data-testid="select-option-a"]')!;
    expect(option).not.toBeNull();
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect((wrapper.emitted('update:value') as string[][][] | undefined)![0]![0]).toBe('a');
    wrapper.destroy();
  });

  it('marks selected option with --selected', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: OPTS, show: true, value: 'b' },
    });
    const options = document.querySelectorAll('.cx-ui-select__option');
    expect(options[1]!.classList.contains('cx-ui-select__option--selected')).toBe(true);
    wrapper.destroy();
  });

  it('renders tags in multiple mode', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: OPTS, multiple: true, value: ['a', 'b'] },
    });
    const tags = wrapper.findAll('.cx-ui-select__tag');
    expect(tags).toHaveLength(2);
    wrapper.destroy();
  });

  it('injects the chronix-select stylesheet', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { options: OPTS },
    });
    expect(document.head.querySelector('style[data-chronix-ui="select"]')).not.toBeNull();
    wrapper.destroy();
  });
});
