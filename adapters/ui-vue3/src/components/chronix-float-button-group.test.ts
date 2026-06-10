import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

import { ChronixFloatButtonGroup } from './chronix-float-button-group.js';
import { ChronixFloatButton } from './chronix-float-button.js';

describe('ChronixFloatButtonGroup (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('static cluster (no trigger) — no main button, children always visible', () => {
    const wrapper = mount(ChronixFloatButtonGroup, {
      slots: {
        default: () => h(ChronixFloatButton),
      },
    });
    const root = wrapper.find('.cx-ui-float-button-group');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('cx-ui-float-button-group--expanded');
    expect(root.find('.cx-ui-float-button-group__trigger').exists()).toBe(false);
  });

  it('click trigger adds trigger modifier + collapses by default', () => {
    const wrapper = mount(ChronixFloatButtonGroup, { props: { trigger: 'click' } });
    const root = wrapper.find('.cx-ui-float-button-group');
    expect(root.classes()).toContain('cx-ui-float-button-group--trigger-click');
    expect(root.classes()).not.toContain('cx-ui-float-button-group--expanded');
  });

  it('toggles --expanded on main button click', async () => {
    const wrapper = mount(ChronixFloatButtonGroup, { props: { trigger: 'click' } });
    await wrapper.find('.cx-ui-float-button-group__trigger').trigger('click');
    expect(wrapper.find('.cx-ui-float-button-group').classes()).toContain(
      'cx-ui-float-button-group--expanded',
    );
    expect(wrapper.emitted('update:expanded')?.[0]).toEqual([true]);
  });

  it('square + hover trigger drives modifier', () => {
    const wrapper = mount(ChronixFloatButtonGroup, {
      props: { shape: 'square', trigger: 'hover' },
    });
    const root = wrapper.find('.cx-ui-float-button-group');
    expect(root.classes()).toContain('cx-ui-float-button-group--shape-square');
    expect(root.classes()).toContain('cx-ui-float-button-group--trigger-hover');
  });

  it('injects the chronix-float-button-group stylesheet', () => {
    mount(ChronixFloatButtonGroup);
    expect(
      document.head.querySelector('style[data-chronix-ui="float-button-group"]'),
    ).not.toBeNull();
  });
});
