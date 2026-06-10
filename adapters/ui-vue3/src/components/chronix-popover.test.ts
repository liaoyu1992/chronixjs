import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

import { ChronixPopover } from './chronix-popover.js';

describe('ChronixPopover (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders trigger span without a popup when show=false (manual)', () => {
    const wrapper = mount(ChronixPopover, {
      attachTo: document.body,
      props: { show: false, trigger: 'manual' },
      slots: {
        default: () => h('button', {}, 'open'),
        content: () => 'Popover body',
      },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-popover__trigger');
    expect(document.querySelector('.cx-ui-popover')).toBeNull();
    wrapper.unmount();
  });

  it('teleports popover content into document.body when show=true', () => {
    const wrapper = mount(ChronixPopover, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual' },
      slots: {
        default: () => h('button', {}, 'trigger'),
        content: () => 'Popover body',
      },
    });
    const popup = document.querySelector('.cx-ui-popover');
    expect(popup).not.toBeNull();
    expect(popup!.classList.contains('cx-ui-popover--open')).toBe(true);
    expect(popup!.textContent).toContain('Popover body');
    wrapper.unmount();
  });

  it('applies placement modifier class (--top-start)', () => {
    const wrapper = mount(ChronixPopover, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', placement: 'top-start' },
      slots: {
        default: () => h('button', {}, 'trigger'),
        content: () => 'x',
      },
    });
    const popup = document.querySelector('.cx-ui-popover');
    expect(popup!.classList.contains('cx-ui-popover--top-start')).toBe(true);
    wrapper.unmount();
  });

  it('injects the chronix-popover stylesheet', () => {
    const wrapper = mount(ChronixPopover, {
      attachTo: document.body,
      slots: { default: () => 'trigger' },
    });
    expect(document.head.querySelector('style[data-chronix-ui="popover"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('emits update:show on click when trigger=click', async () => {
    const wrapper = mount(ChronixPopover, {
      attachTo: document.body,
      props: { trigger: 'click' },
      slots: {
        default: () => h('button', {}, 'trigger'),
        content: () => 'body',
      },
    });
    await wrapper.find('span.cx-ui-popover__trigger').trigger('click');
    expect(wrapper.emitted('update:show')?.[0]).toEqual([true]);
    wrapper.unmount();
  });
});
