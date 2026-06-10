// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixInfiniteScroll } from './chronix-infinite-scroll.js';

const InfiniteScroll = ChronixInfiniteScroll as unknown as VueConstructor;

describe('ChronixInfiniteScroll (vue2)', () => {
  it('renders a <div> with base cx-ui-infinite-scroll class and sentinel', () => {
    const wrapper = mount(InfiniteScroll, {
      slots: { default: '<p>Content</p>' },
    });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-infinite-scroll');
    expect(wrapper.find('.cx-ui-infinite-scroll__sentinel').exists()).toBe(true);
  });

  it('injects the chronix-infinite-scroll stylesheet into document.head', () => {
    mount(InfiniteScroll);
    expect(document.head.querySelector('style[data-chronix-ui="infinite-scroll"]')).not.toBeNull();
  });
});
