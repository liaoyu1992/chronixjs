import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixFloatButtonGroup } from './chronix-float-button-group.js';

const C = ChronixFloatButtonGroup as unknown as VueConstructor;

describe('ChronixFloatButtonGroup (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('static cluster (no trigger) — no main button, children always visible', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C);
      },
    });
    const wrapper = mount(Wrapper);
    const root = wrapper.find('.cx-ui-float-button-group');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('cx-ui-float-button-group--expanded');
    expect(root.find('.cx-ui-float-button-group__trigger').exists()).toBe(false);
  });

  it('click trigger adds trigger modifier + collapses by default', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { trigger: 'click' } });
      },
    });
    const wrapper = mount(Wrapper);
    const root = wrapper.find('.cx-ui-float-button-group');
    expect(root.classes()).toContain('cx-ui-float-button-group--trigger-click');
    expect(root.classes()).not.toContain('cx-ui-float-button-group--expanded');
  });

  it('toggles --expanded on main button click', async () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { trigger: 'click' } });
      },
    });
    const wrapper = mount(Wrapper);
    await wrapper.find('.cx-ui-float-button-group__trigger').trigger('click');
    expect(wrapper.find('.cx-ui-float-button-group').classes()).toContain(
      'cx-ui-float-button-group--expanded',
    );
  });

  it('square + hover trigger drives modifier', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { shape: 'square', trigger: 'hover' } });
      },
    });
    const wrapper = mount(Wrapper);
    const root = wrapper.find('.cx-ui-float-button-group');
    expect(root.classes()).toContain('cx-ui-float-button-group--shape-square');
    expect(root.classes()).toContain('cx-ui-float-button-group--trigger-hover');
  });

  it('injects the chronix-float-button-group stylesheet', () => {
    mount(C, { propsData: {} });
    expect(
      document.head.querySelector('style[data-chronix-ui="float-button-group"]'),
    ).not.toBeNull();
  });
});
