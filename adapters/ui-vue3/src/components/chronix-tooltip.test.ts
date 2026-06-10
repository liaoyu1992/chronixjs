import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

import { ChronixTooltip } from './chronix-tooltip.js';

describe('ChronixTooltip (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders trigger span without tooltip when show=false', () => {
    const wrapper = mount(ChronixTooltip, {
      attachTo: document.body,
      props: { show: false, trigger: 'manual', content: 'hint' },
      slots: { default: () => h('button', {}, 'hover me') },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(document.querySelector('.cx-ui-tooltip')).toBeNull();
    wrapper.unmount();
  });

  it('teleports tooltip content into body when show=true', () => {
    const wrapper = mount(ChronixTooltip, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', content: 'hint text' },
      slots: { default: () => h('button', {}, 'hover me') },
    });
    const tooltip = document.querySelector('.cx-ui-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip!.textContent).toBe('hint text');
    wrapper.unmount();
  });

  it('default placement is top → --top modifier present', () => {
    const wrapper = mount(ChronixTooltip, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', content: 'x' },
      slots: { default: () => h('button') },
    });
    expect(document.querySelector('.cx-ui-tooltip')!.classList.contains('cx-ui-tooltip--top')).toBe(
      true,
    );
    wrapper.unmount();
  });

  it('injects the chronix-tooltip stylesheet', () => {
    const wrapper = mount(ChronixTooltip, {
      attachTo: document.body,
      props: { content: '' },
      slots: { default: () => 'x' },
    });
    expect(document.head.querySelector('style[data-chronix-ui="tooltip"]')).not.toBeNull();
    wrapper.unmount();
  });
});
