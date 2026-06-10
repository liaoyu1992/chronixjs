import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixAvatarGroup } from './chronix-avatar-group.js';

import type { AvatarItem } from '@chronixjs/ui';

const C = ChronixAvatarGroup as unknown as VueConstructor;

const ITEMS: readonly AvatarItem[] = [
  { key: 'a', src: undefined, text: 'A' },
  { key: 'b', src: undefined, text: 'B' },
  { key: 'c', src: undefined, text: 'C' },
  { key: 'd', src: undefined, text: 'D' },
  { key: 'e', src: undefined, text: 'E' },
  { key: 'f', src: undefined, text: 'F' },
  { key: 'g', src: undefined, text: 'G' },
];

describe('ChronixAvatarGroup (vue2)', () => {
  it('renders <div> base + --circle', () => {
    const wrapper = mount(C, { propsData: { items: ITEMS.slice(0, 3) } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-avatar-group');
  });

  it('renders all avatars when items.length <= max', () => {
    const wrapper = mount(C, { propsData: { items: ITEMS.slice(0, 3), max: 5 } });
    expect(wrapper.findAll('.cx-ui-avatar')).toHaveLength(3);
    expect(wrapper.find('.cx-ui-avatar-group__overflow').exists()).toBe(false);
  });

  it('renders max-1 + overflow when items.length > max', () => {
    const wrapper = mount(C, { propsData: { items: ITEMS, max: 5 } });
    expect(wrapper.findAll('.cx-ui-avatar')).toHaveLength(5);
    const overflow = wrapper.find('.cx-ui-avatar-group__overflow');
    expect(overflow.exists()).toBe(true);
    expect(overflow.text()).toBe('+3');
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="avatar-group"]')).not.toBeNull();
  });
});
