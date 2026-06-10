import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixEllipsis } from './chronix-ellipsis.js';

const Ellipsis = ChronixEllipsis as unknown as VueConstructor;

describe('ChronixEllipsis (vue2) — root rendering', () => {
  it('renders a <span> with the base + --lines-1 + --with-tooltip class for default props', () => {
    const wrapper = mount(Ellipsis, {
      propsData: { content: 'Some text' },
    });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-ellipsis');
    expect(wrapper.classes()).toContain('cx-ui-ellipsis--lines-1');
    expect(wrapper.classes()).toContain('cx-ui-ellipsis--with-tooltip');
  });

  it('renders the content as the inner text', () => {
    const wrapper = mount(Ellipsis, {
      propsData: { content: 'Hello world' },
    });
    expect(wrapper.text()).toBe('Hello world');
  });

  it('renders an empty <span> when content is empty', () => {
    const wrapper = mount(Ellipsis);
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.text()).toBe('');
  });
});

describe('ChronixEllipsis (vue2) — title attribute', () => {
  it('sets title attribute equal to content when tooltip=true (default)', () => {
    const wrapper = mount(Ellipsis, {
      propsData: { content: 'Tooltip text' },
    });
    expect(wrapper.attributes('title')).toBe('Tooltip text');
  });

  it('does not set title attribute when tooltip=false', () => {
    const wrapper = mount(Ellipsis, {
      propsData: { content: 'No tooltip', tooltip: false },
    });
    expect(wrapper.attributes('title')).toBeUndefined();
    expect(wrapper.classes()).not.toContain('cx-ui-ellipsis--with-tooltip');
  });
});

describe('ChronixEllipsis (vue2) — lineClamp modifier', () => {
  it('emits --lines-2 modifier when lineClamp=2', () => {
    const wrapper = mount(Ellipsis, {
      propsData: { content: 'multi line content', lineClamp: 2 },
    });
    expect(wrapper.classes()).toContain('cx-ui-ellipsis--lines-2');
    expect(wrapper.classes()).not.toContain('cx-ui-ellipsis--lines-1');
  });

  it('omits --lines-N when lineClamp is out of [1, 5]', () => {
    const wrapper = mount(Ellipsis, {
      propsData: { content: 'extreme', lineClamp: 10 },
    });
    expect(wrapper.classes().some((c) => c.startsWith('cx-ui-ellipsis--lines-'))).toBe(false);
  });
});

describe('ChronixEllipsis (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-ellipsis stylesheet is in document.head', () => {
    mount(Ellipsis, { propsData: { content: 'inject test' } });
    expect(document.head.querySelector('style[data-chronix-ui="ellipsis"]')).not.toBeNull();
  });
});
