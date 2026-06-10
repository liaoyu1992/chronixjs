import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixHighlight } from './chronix-highlight.js';

describe('ChronixHighlight (vue3)', () => {
  it('renders a <span> root with no <mark> when pattern is empty', () => {
    const wrapper = mount(ChronixHighlight, { props: { value: 'hello world' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.findAll('mark')).toHaveLength(0);
    expect(wrapper.text()).toBe('hello world');
  });

  it('wraps matched substrings in <mark class="cx-ui-highlight__match">', () => {
    const wrapper = mount(ChronixHighlight, {
      props: { value: 'foobarbaz', pattern: 'bar' },
    });
    const marks = wrapper.findAll('mark.cx-ui-highlight__match');
    expect(marks).toHaveLength(1);
    expect(marks[0]!.text()).toBe('bar');
    expect(wrapper.text()).toBe('foobarbaz');
  });

  it('respects caseSensitive=true', () => {
    const wrapper = mount(ChronixHighlight, {
      props: { value: 'Foo BAR baz', pattern: 'bar', caseSensitive: true },
    });
    expect(wrapper.findAll('mark')).toHaveLength(0);
  });

  it('injects the chronix-highlight stylesheet', () => {
    mount(ChronixHighlight);
    expect(document.head.querySelector('style[data-chronix-ui="highlight"]')).not.toBeNull();
  });
});
