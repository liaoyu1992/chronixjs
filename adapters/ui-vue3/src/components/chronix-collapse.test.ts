import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixCollapse } from './chronix-collapse.js';

const items = [
  { key: 'a', title: 'A title', content: 'A body', disabled: false },
  { key: 'b', title: 'B title', content: 'B body', disabled: false },
] as const;

describe('ChronixCollapse (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders one item per items entry with the title in the header', () => {
    const wrapper = mount(ChronixCollapse, { props: { items, value: undefined } });
    const itemEls = wrapper.findAll('.cx-ui-collapse__item');
    expect(itemEls.length).toBe(2);
    expect(itemEls[0]?.text()).toContain('A title');
  });

  it('marks the expanded item with --expanded when value matches', () => {
    const wrapper = mount(ChronixCollapse, {
      props: { items, value: ['a'], accordion: false },
    });
    const itemA = wrapper.find('[data-item-key="a"]');
    expect(itemA.classes()).toContain('cx-ui-collapse__item--expanded');
  });

  it('emits update:value on header click (accordion mode)', async () => {
    const wrapper = mount(ChronixCollapse, {
      props: { items, value: undefined, accordion: true },
    });
    await wrapper.find('[data-item-key="a"] .cx-ui-collapse__header').trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
  });

  it('switches arrow placement modifier on root', () => {
    const wrapper = mount(ChronixCollapse, {
      props: { items, value: undefined, arrowPlacement: 'right' },
    });
    expect(wrapper.find('.cx-ui-collapse').classes()).toContain('cx-ui-collapse--arrow-right');
  });

  it('injects the chronix-collapse stylesheet', () => {
    mount(ChronixCollapse, { props: { items, value: undefined } });
    expect(document.head.querySelector('style[data-chronix-ui="collapse"]')).not.toBeNull();
  });
});
