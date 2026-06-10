import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixCollapseTransition } from './chronix-collapse-transition.js';

describe('ChronixCollapseTransition (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the wrapper with base class + applies height: 0px when initial show=false', () => {
    const wrapper = mount(ChronixCollapseTransition, {
      props: { show: false },
      slots: { default: () => 'inner' },
    });
    expect((wrapper.element as HTMLElement).classList.contains('cx-ui-collapse-transition')).toBe(
      true,
    );
    expect((wrapper.element as HTMLElement).style.height).toBe('0px');
    expect((wrapper.element as HTMLElement).style.overflow).toBe('hidden');
  });

  it('adds --expanded class when show=true', () => {
    const wrapper = mount(ChronixCollapseTransition, {
      props: { show: true },
      slots: { default: () => 'inner' },
    });
    expect(
      (wrapper.element as HTMLElement).classList.contains('cx-ui-collapse-transition--expanded'),
    ).toBe(true);
  });

  it('injects the chronix-collapse-transition stylesheet', () => {
    mount(ChronixCollapseTransition, { props: { show: false } });
    expect(
      document.head.querySelector('style[data-chronix-ui="collapse-transition"]'),
    ).not.toBeNull();
  });
});
