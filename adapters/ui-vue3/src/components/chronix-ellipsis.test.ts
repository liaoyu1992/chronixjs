import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixEllipsis } from './chronix-ellipsis.js';

describe('ChronixEllipsis — root rendering', () => {
  it('renders a <span> with the base + --lines-1 + --with-tooltip class for default props', () => {
    const wrapper = mount(ChronixEllipsis, {
      props: { content: 'Some text' },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-ellipsis');
    expect(wrapper.classes()).toContain('cx-ui-ellipsis--lines-1');
    expect(wrapper.classes()).toContain('cx-ui-ellipsis--with-tooltip');
  });

  it('renders the content as the inner text', () => {
    const wrapper = mount(ChronixEllipsis, {
      props: { content: 'Hello world' },
    });
    expect(wrapper.text()).toBe('Hello world');
  });

  it('renders an empty <span> when content is empty', () => {
    const wrapper = mount(ChronixEllipsis);
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.text()).toBe('');
  });
});

describe('ChronixEllipsis — title attribute', () => {
  it('sets title attribute equal to content when tooltip=true (default)', () => {
    const wrapper = mount(ChronixEllipsis, {
      props: { content: 'Tooltip text' },
    });
    expect(wrapper.attributes('title')).toBe('Tooltip text');
  });

  it('does not set title attribute when tooltip=false', () => {
    const wrapper = mount(ChronixEllipsis, {
      props: { content: 'No tooltip', tooltip: false },
    });
    expect(wrapper.attributes('title')).toBeUndefined();
    expect(wrapper.classes()).not.toContain('cx-ui-ellipsis--with-tooltip');
  });
});

describe('ChronixEllipsis — lineClamp modifier', () => {
  it('emits --lines-2 modifier when lineClamp=2', () => {
    const wrapper = mount(ChronixEllipsis, {
      props: { content: 'multi line content', lineClamp: 2 },
    });
    expect(wrapper.classes()).toContain('cx-ui-ellipsis--lines-2');
    expect(wrapper.classes()).not.toContain('cx-ui-ellipsis--lines-1');
  });

  it('omits --lines-N when lineClamp is out of [1, 5]', () => {
    const wrapper = mount(ChronixEllipsis, {
      props: { content: 'extreme', lineClamp: 10 },
    });
    expect(wrapper.classes().some((c) => c.startsWith('cx-ui-ellipsis--lines-'))).toBe(false);
  });
});

describe('ChronixEllipsis — CSS injection', () => {
  it('mounting ensures the chronix-ellipsis stylesheet is in document.head', () => {
    mount(ChronixEllipsis, { props: { content: 'inject test' } });
    expect(document.head.querySelector('style[data-chronix-ui="ellipsis"]')).not.toBeNull();
  });
});
