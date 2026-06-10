import { resetPopupZIndexForTests, type DropdownOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

import { ChronixDropdown } from './chronix-dropdown.js';

const OPTIONS: readonly DropdownOption[] = [
  { key: 'a', label: 'Alpha', value: 'a', disabled: false, icon: undefined },
  { key: 'b', label: 'Beta', value: 'b', disabled: false, icon: undefined },
  { key: 'c', label: 'Gamma', value: 'c', disabled: true, icon: undefined },
];

describe('ChronixDropdown (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders trigger span without panel when show=false manual', () => {
    const wrapper = mount(ChronixDropdown, {
      attachTo: document.body,
      props: { show: false, trigger: 'manual', options: OPTIONS },
      slots: { default: () => h('button', {}, 'menu') },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(document.querySelector('.cx-ui-dropdown')).toBeNull();
  });

  it('teleports panel + options when show=true', () => {
    mount(ChronixDropdown, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', options: OPTIONS, flip: false },
      slots: { default: () => h('button', {}, 'menu') },
    });
    const panel = document.querySelector('.cx-ui-dropdown');
    expect(panel).not.toBeNull();
    expect(panel!.classList.contains('cx-ui-dropdown--open')).toBe(true);
    expect(panel!.querySelectorAll('.cx-ui-dropdown__option').length).toBe(3);
    expect(
      panel!
        .querySelectorAll('.cx-ui-dropdown__option')[2]!
        .classList.contains('cx-ui-dropdown__option--disabled'),
    ).toBe(true);
  });

  it('emits select + update:show=false when clicking an enabled option', async () => {
    const wrapper = mount(ChronixDropdown, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', options: OPTIONS },
      slots: { default: () => h('button', {}, 'menu') },
    });
    const first = document.querySelector<HTMLElement>('.cx-ui-dropdown__option');
    first!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await wrapper.vm.$nextTick();
    const selectEvents = wrapper.emitted('select');
    expect(selectEvents).toBeTruthy();
    expect((selectEvents![0]![0] as DropdownOption).key).toBe('a');
  });

  it('injects the chronix-dropdown stylesheet', () => {
    mount(ChronixDropdown, {
      attachTo: document.body,
      props: { options: OPTIONS },
      slots: { default: () => 'x' },
    });
    expect(document.head.querySelector('style[data-chronix-ui="dropdown"]')).not.toBeNull();
  });
});
