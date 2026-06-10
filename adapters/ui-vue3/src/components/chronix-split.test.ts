import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixSplit } from './chronix-split.js';

describe('ChronixSplit (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders 2 panes + 1 bar in horizontal mode by default', () => {
    const wrapper = mount(ChronixSplit, {
      slots: { first: () => 'L', second: () => 'R' },
    });
    expect(wrapper.find('.cx-ui-split').classes()).toContain('cx-ui-split--direction-horizontal');
    expect(wrapper.find('.cx-ui-split__pane--first').text()).toContain('L');
    expect(wrapper.find('.cx-ui-split__pane--second').text()).toContain('R');
    expect(wrapper.findAll('.cx-ui-split__bar').length).toBe(1);
  });

  it('vertical direction modifier is applied', () => {
    const wrapper = mount(ChronixSplit, {
      props: { direction: 'vertical' },
      slots: { first: () => 'T', second: () => 'B' },
    });
    expect(wrapper.find('.cx-ui-split').classes()).toContain('cx-ui-split--direction-vertical');
  });

  it('bar carries role="separator" + aria-orientation', () => {
    const wrapper = mount(ChronixSplit, {
      slots: { first: () => 'a', second: () => 'b' },
    });
    const bar = wrapper.find('.cx-ui-split__bar');
    expect(bar.attributes('role')).toBe('separator');
    expect(bar.attributes('aria-orientation')).toBe('vertical');
  });

  it('disabled prop adds --disabled modifier', () => {
    const wrapper = mount(ChronixSplit, {
      props: { disabled: true },
      slots: { first: () => 'a', second: () => 'b' },
    });
    expect(wrapper.find('.cx-ui-split').classes()).toContain('cx-ui-split--disabled');
  });

  it('injects the chronix-split stylesheet', () => {
    mount(ChronixSplit, { slots: { first: () => 'a', second: () => 'b' } });
    expect(document.head.querySelector('style[data-chronix-ui="split"]')).not.toBeNull();
  });
});
