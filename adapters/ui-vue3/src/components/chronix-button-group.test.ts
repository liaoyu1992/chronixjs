import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixButtonGroup } from './chronix-button-group.js';

describe('ChronixButtonGroup (vue3)', () => {
  it('renders a <div role="group"> with base class + --horizontal default', () => {
    const wrapper = mount(ChronixButtonGroup);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.classes()).toContain('cx-ui-button-group');
    expect(wrapper.classes()).toContain('cx-ui-button-group--horizontal');
  });

  it('adds --vertical when vertical=true', () => {
    const wrapper = mount(ChronixButtonGroup, { props: { vertical: true } });
    expect(wrapper.classes()).toContain('cx-ui-button-group--vertical');
  });

  it('renders default slot children', () => {
    const wrapper = mount(ChronixButtonGroup, {
      slots: { default: '<button class="b">A</button><button class="b">B</button>' },
    });
    expect(wrapper.findAll('.b')).toHaveLength(2);
  });

  it('injects the chronix-button-group stylesheet', () => {
    mount(ChronixButtonGroup);
    expect(document.head.querySelector('style[data-chronix-ui="button-group"]')).not.toBeNull();
  });
});
