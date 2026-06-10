import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixCollapseTransition } from './chronix-collapse-transition.js';

const C = ChronixCollapseTransition as unknown as VueConstructor;

describe('ChronixCollapseTransition (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the wrapper with base class + height:0 when initial show=false', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { show: false } }, ['inner']);
      },
    });
    const wrapper = mount(Wrapper);
    const root = wrapper.find('.cx-ui-collapse-transition');
    expect(root.exists()).toBe(true);
    expect((root.element as HTMLElement).style.height).toBe('0px');
    expect((root.element as HTMLElement).style.overflow).toBe('hidden');
  });

  it('adds --expanded class when show=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { show: true } }, ['inner']);
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-collapse-transition--expanded').exists()).toBe(true);
  });

  it('injects the chronix-collapse-transition stylesheet', () => {
    mount(C, { propsData: { show: false } });
    expect(
      document.head.querySelector('style[data-chronix-ui="collapse-transition"]'),
    ).not.toBeNull();
  });
});
