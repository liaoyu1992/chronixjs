import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixCollapse } from './chronix-collapse.js';

const C = ChronixCollapse as unknown as VueConstructor;

const items = [
  { key: 'a', title: 'A title', content: 'A body', disabled: false },
  { key: 'b', title: 'B title', content: 'B body', disabled: false },
] as const;

describe('ChronixCollapse (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders one item per items entry with the title in the header', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items, value: undefined } });
      },
    });
    const wrapper = mount(Wrapper);
    const itemEls = wrapper.findAll('.cx-ui-collapse__item');
    expect(itemEls.length).toBe(2);
    expect(itemEls.at(0).text()).toContain('A title');
  });

  it('marks the expanded item with --expanded when value matches', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items, value: ['a'], accordion: false } });
      },
    });
    const wrapper = mount(Wrapper);
    const itemA = wrapper.find('[data-item-key="a"]');
    expect(itemA.classes()).toContain('cx-ui-collapse__item--expanded');
  });

  it('switches arrow placement modifier on root', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items, value: undefined, arrowPlacement: 'right' } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-collapse').classes()).toContain('cx-ui-collapse--arrow-right');
  });

  it('injects the chronix-collapse stylesheet', () => {
    mount(C, { propsData: { items, value: undefined } });
    expect(document.head.querySelector('style[data-chronix-ui="collapse"]')).not.toBeNull();
  });
});
