// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixAnchor } from './chronix-anchor.js';

const Anchor = ChronixAnchor as unknown as VueConstructor;

describe('ChronixAnchor (vue2)', () => {
  const items = [
    { key: 's1', label: 'Section 1', href: '#s1' },
    { key: 's2', label: 'Section 2', href: '#s2' },
  ];

  it('renders a <div> with base cx-ui-anchor class and anchor links', () => {
    const wrapper = mount(Anchor, { propsData: { items } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-anchor');
    expect(wrapper.findAll('.cx-ui-anchor__link')).toHaveLength(2);
    expect(wrapper.find('[data-anchor-key="s1"]').exists()).toBe(true);
  });

  it('injects the chronix-anchor stylesheet into document.head', () => {
    mount(Anchor, { propsData: { items: [] } });
    expect(document.head.querySelector('style[data-chronix-ui="anchor"]')).not.toBeNull();
  });
});
