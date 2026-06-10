import { resetPopupZIndexForTests, type PopSelectOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

import { ChronixPopSelect } from './chronix-pop-select.js';

const OPTS: readonly PopSelectOption[] = [
  { key: 'a', label: 'Apple', value: 'a', disabled: false },
  { key: 'b', label: 'Banana', value: 'b', disabled: false },
  { key: 'c', label: 'Cherry', value: 'c', disabled: true },
];

describe('ChronixPopSelect (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders 3 option items when show=true', () => {
    const wrapper = mount(ChronixPopSelect, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', options: OPTS },
      slots: { default: () => h('button', {}, 'select') },
    });
    const list = document.querySelector('.cx-ui-pop-select__list');
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll('.cx-ui-pop-select__option')).toHaveLength(3);
    wrapper.unmount();
  });

  it('marks selected option with --active', () => {
    const wrapper = mount(ChronixPopSelect, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', options: OPTS, value: 'b' },
      slots: { default: () => h('button') },
    });
    const options = document.querySelectorAll('.cx-ui-pop-select__option');
    expect(options[0]!.classList.contains('cx-ui-pop-select__option--active')).toBe(false);
    expect(options[1]!.classList.contains('cx-ui-pop-select__option--active')).toBe(true);
    wrapper.unmount();
  });

  it('marks disabled option with --disabled', () => {
    const wrapper = mount(ChronixPopSelect, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', options: OPTS },
      slots: { default: () => h('button') },
    });
    const options = document.querySelectorAll('.cx-ui-pop-select__option');
    expect(options[2]!.classList.contains('cx-ui-pop-select__option--disabled')).toBe(true);
    wrapper.unmount();
  });

  it('default placement is bottom-start → --bottom-start modifier present', () => {
    const wrapper = mount(ChronixPopSelect, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', options: OPTS },
      slots: { default: () => h('button') },
    });
    expect(
      document
        .querySelector('.cx-ui-pop-select')!
        .classList.contains('cx-ui-pop-select--bottom-start'),
    ).toBe(true);
    wrapper.unmount();
  });

  it('injects the chronix-pop-select stylesheet', () => {
    const wrapper = mount(ChronixPopSelect, {
      attachTo: document.body,
      props: { options: OPTS },
      slots: { default: () => 'trigger' },
    });
    expect(document.head.querySelector('style[data-chronix-ui="pop-select"]')).not.toBeNull();
    wrapper.unmount();
  });
});
