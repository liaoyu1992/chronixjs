import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

import { ChronixPopconfirm } from './chronix-popconfirm.js';

describe('ChronixPopconfirm (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders title + positive/negative buttons when show=true', () => {
    const wrapper = mount(ChronixPopconfirm, {
      attachTo: document.body,
      props: {
        show: true,
        trigger: 'manual',
        title: 'Delete this?',
        positiveText: 'Yes',
        negativeText: 'No',
      },
      slots: { default: () => h('button', {}, 'delete') },
    });
    const root = document.querySelector('.cx-ui-popconfirm');
    expect(root).not.toBeNull();
    expect(root!.querySelector('.cx-ui-popconfirm__title')!.textContent).toBe('Delete this?');
    const actions = root!.querySelectorAll('.cx-ui-popconfirm__action');
    expect(actions).toHaveLength(2);
    expect(actions[0]!.textContent).toBe('No');
    expect(actions[1]!.textContent).toBe('Yes');
    expect(actions[1]!.classList.contains('cx-ui-popconfirm__action--positive')).toBe(true);
    wrapper.unmount();
  });

  it('action buttons have type=button (no form submit)', () => {
    const wrapper = mount(ChronixPopconfirm, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', title: 't' },
      slots: { default: () => h('button') },
    });
    const actions = document.querySelectorAll('.cx-ui-popconfirm__action');
    actions.forEach((b) => expect(b.getAttribute('type')).toBe('button'));
    wrapper.unmount();
  });

  it('emits positive-click + update:show(false) on positive click', () => {
    const wrapper = mount(ChronixPopconfirm, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', title: 't' },
      slots: { default: () => h('button') },
    });
    const positive = document.querySelector<HTMLElement>('.cx-ui-popconfirm__action--positive')!;
    positive.click();
    expect(wrapper.emitted('positive-click')).toHaveLength(1);
    expect(wrapper.emitted('update:show')?.at(-1)).toEqual([false]);
    wrapper.unmount();
  });

  it('renders SVG warning icon in header', () => {
    const wrapper = mount(ChronixPopconfirm, {
      attachTo: document.body,
      props: { show: true, trigger: 'manual', title: 't' },
      slots: { default: () => h('button') },
    });
    expect(document.querySelector('svg.cx-ui-popconfirm__icon')).not.toBeNull();
    wrapper.unmount();
  });

  it('injects the chronix-popconfirm stylesheet', () => {
    const wrapper = mount(ChronixPopconfirm, {
      attachTo: document.body,
      props: { title: '' },
      slots: { default: () => 'trigger' },
    });
    expect(document.head.querySelector('style[data-chronix-ui="popconfirm"]')).not.toBeNull();
    wrapper.unmount();
  });
});
