import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixButtonGroup } from './chronix-button-group.js';

const C = ChronixButtonGroup as unknown as VueConstructor;

describe('ChronixButtonGroup (vue2)', () => {
  it('renders <div role="group"> base + --horizontal', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.classes()).toContain('cx-ui-button-group--horizontal');
  });

  it('emits --vertical when vertical=true', () => {
    const wrapper = mount(C, { propsData: { vertical: true } });
    expect(wrapper.classes()).toContain('cx-ui-button-group--vertical');
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="button-group"]')).not.toBeNull();
  });
});
