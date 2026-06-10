import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixAvatarGroup } from './chronix-avatar-group.js';

import type { AvatarItem } from '@chronixjs/ui';

const ITEMS: readonly AvatarItem[] = [
  { key: 'a', src: undefined, text: 'A' },
  { key: 'b', src: undefined, text: 'B' },
  { key: 'c', src: undefined, text: 'C' },
  { key: 'd', src: undefined, text: 'D' },
  { key: 'e', src: undefined, text: 'E' },
  { key: 'f', src: undefined, text: 'F' },
  { key: 'g', src: undefined, text: 'G' },
];

describe('ChronixAvatarGroup (vue3)', () => {
  it('renders a <div> with base class', () => {
    const wrapper = mount(ChronixAvatarGroup, { props: { items: ITEMS.slice(0, 3) } });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-avatar-group');
  });

  it('renders all avatars when items.length <= max', () => {
    const wrapper = mount(ChronixAvatarGroup, {
      props: { items: ITEMS.slice(0, 3), max: 5 },
    });
    expect(wrapper.findAll('.cx-ui-avatar')).toHaveLength(3);
    expect(wrapper.find('.cx-ui-avatar-group__overflow').exists()).toBe(false);
  });

  it('renders max-1 avatars + overflow indicator when items.length > max', () => {
    const wrapper = mount(ChronixAvatarGroup, { props: { items: ITEMS, max: 5 } });
    // 4 avatars + 1 overflow indicator = 5 .cx-ui-avatar nodes total
    expect(wrapper.findAll('.cx-ui-avatar')).toHaveLength(5);
    const overflow = wrapper.find('.cx-ui-avatar-group__overflow');
    expect(overflow.exists()).toBe(true);
    expect(overflow.text()).toBe('+3');
  });

  it('injects the chronix-avatar-group stylesheet', () => {
    mount(ChronixAvatarGroup);
    expect(document.head.querySelector('style[data-chronix-ui="avatar-group"]')).not.toBeNull();
  });
});
