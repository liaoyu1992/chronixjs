import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixSelect } from './chronix-select.js';

const OPTS: readonly SelectOption[] = [
  { key: 'a', label: 'Apple', value: 'a' },
  { key: 'b', label: 'Banana', value: 'b' },
  { key: 'c', label: 'Cherry', value: 'c', disabled: true },
];

const GROUPED_OPTS: readonly SelectOption[] = [
  {
    key: 'fruits',
    label: 'Fruits',
    children: [
      { key: 'a', label: 'Apple', value: 'a' },
      { key: 'b', label: 'Banana', value: 'b' },
    ],
  },
  { key: 'd', label: 'Dog', value: 'd' },
];

describe('ChronixSelect (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root with data-testid select-root', () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: OPTS },
    });
    expect(wrapper.find('[data-testid="select-root"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('opens dropdown on trigger click and shows options', () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: OPTS, show: true },
    });
    // When show=true, dropdown portal should render
    const dropdown = document.querySelector('[data-testid="select-dropdown-popup"]');
    expect(dropdown).not.toBeNull();
    const options = dropdown!.querySelectorAll('.cx-ui-select__option');
    expect(options).toHaveLength(3);
    wrapper.unmount();
  });

  it('emits update:value on option click', async () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: OPTS, show: true },
    });
    const option = document.querySelector('[data-testid="select-option-a"]')!;
    expect(option).not.toBeNull();
    option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')![0]![0]).toBe('a');
    wrapper.unmount();
  });

  it('marks selected option with --selected', () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: OPTS, show: true, value: 'b' },
    });
    const options = document.querySelectorAll('.cx-ui-select__option');
    expect(options[0]!.classList.contains('cx-ui-select__option--selected')).toBe(false);
    expect(options[1]!.classList.contains('cx-ui-select__option--selected')).toBe(true);
    wrapper.unmount();
  });

  it('renders grouped options preserving group label', () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: GROUPED_OPTS, show: true },
    });
    const options = document.querySelectorAll('.cx-ui-select__option');
    // group label + apple + banana + dog = 4
    expect(options).toHaveLength(4);
    expect(options[0]!.classList.contains('cx-ui-select__option--group-label')).toBe(true);
    wrapper.unmount();
  });

  it('renders tags in multiple mode', () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: OPTS, multiple: true, value: ['a', 'b'] },
    });
    const tags = wrapper.findAll('.cx-ui-select__tag');
    expect(tags).toHaveLength(2);
    wrapper.unmount();
  });

  it('removes tag on tag-close click', async () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: OPTS, multiple: true, value: ['a', 'b'] },
    });
    const closeButtons = wrapper.findAll('.cx-ui-select__tag-close');
    expect(closeButtons).toHaveLength(2);
    await closeButtons[0]!.trigger('mousedown');
    expect(wrapper.emitted('update:value')).toBeTruthy();
    // Should emit the remaining values
    const emitted = wrapper.emitted('update:value')![0]![0] as string[];
    expect(emitted).not.toContain('a');
    expect(emitted).toContain('b');
    wrapper.unmount();
  });

  it('shows filter input when filterable', () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: OPTS, filterable: true, show: true },
    });
    const input = document.querySelector('[data-testid="select-filter-input"]');
    expect(input).not.toBeNull();
    wrapper.unmount();
  });

  it('injects the chronix-select stylesheet', () => {
    const wrapper = mount(ChronixSelect, {
      attachTo: document.body,
      props: { options: OPTS },
    });
    expect(document.head.querySelector('style[data-chronix-ui="select"]')).not.toBeNull();
    wrapper.unmount();
  });
});
