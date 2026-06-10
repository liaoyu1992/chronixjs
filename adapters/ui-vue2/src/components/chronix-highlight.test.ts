import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixHighlight } from './chronix-highlight.js';

const C = ChronixHighlight as unknown as VueConstructor;

describe('ChronixHighlight (vue2)', () => {
  it('renders <span> root with no <mark> when pattern is empty', () => {
    const wrapper = mount(C, { propsData: { value: 'hello' } });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.findAll('mark')).toHaveLength(0);
  });

  it('wraps matched substring in <mark.cx-ui-highlight__match>', () => {
    const wrapper = mount(C, { propsData: { value: 'foobarbaz', pattern: 'bar' } });
    const marks = wrapper.findAll('mark.cx-ui-highlight__match');
    expect(marks).toHaveLength(1);
    expect(marks.at(0).text()).toBe('bar');
  });

  it('respects caseSensitive=true', () => {
    const wrapper = mount(C, {
      propsData: { value: 'Foo BAR baz', pattern: 'bar', caseSensitive: true },
    });
    expect(wrapper.findAll('mark')).toHaveLength(0);
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="highlight"]')).not.toBeNull();
  });
});
