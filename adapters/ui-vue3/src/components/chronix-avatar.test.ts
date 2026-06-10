import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixAvatar } from './chronix-avatar.js';

describe('ChronixAvatar (vue3)', () => {
  it('renders <span> with base + --circle by default', () => {
    const wrapper = mount(ChronixAvatar, { props: { text: 'AB' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-avatar');
    expect(wrapper.classes()).toContain('cx-ui-avatar--circle');
  });

  it('renders text content when src is undefined', () => {
    const wrapper = mount(ChronixAvatar, { props: { text: 'CD' } });
    expect(wrapper.text()).toBe('CD');
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('renders <img> when src is set', () => {
    const wrapper = mount(ChronixAvatar, { props: { src: '/a.png', text: 'EF' } });
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('/a.png');
  });

  it.each(['circle', 'square', 'round'] as const)('applies --%s modifier per shape', (shape) => {
    const wrapper = mount(ChronixAvatar, { props: { shape, text: 'X' } });
    expect(wrapper.classes()).toContain(`cx-ui-avatar--${shape}`);
  });

  it('injects the chronix-avatar stylesheet', () => {
    mount(ChronixAvatar);
    expect(document.head.querySelector('style[data-chronix-ui="avatar"]')).not.toBeNull();
  });
});
