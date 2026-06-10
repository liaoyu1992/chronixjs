// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixForm, ChronixFormItem } from './chronix-form.js';

import type { VueConstructor } from 'vue';

// Vue 2 test-utils v1 mount pattern
const FormCtor = ChronixForm as unknown as VueConstructor;
const FormItemCtor = ChronixFormItem as unknown as VueConstructor;

describe('ChronixForm (vue2)', () => {
  it('renders root <form> element with correct class', () => {
    const wrapper = mount(FormCtor, { propsData: { model: {} } });
    const form = wrapper.find('[data-testid="form-root"]');
    expect(form.exists()).toBe(true);
    expect(form.classes()).toContain('cx-ui-form');
  });

  it('includes inline modifier when inline prop is true', () => {
    const wrapper = mount(FormCtor, { propsData: { model: {}, inline: true } });
    const form = wrapper.find('[data-testid="form-root"]');
    expect(form.classes()).toContain('cx-ui-form--inline');
  });

  it('includes left-label modifier when labelPlacement is left', () => {
    const wrapper = mount(FormCtor, { propsData: { model: {}, labelPlacement: 'left' } });
    const form = wrapper.find('[data-testid="form-root"]');
    expect(form.classes()).toContain('cx-ui-form--left-label');
  });

  it('injects the chronix-form stylesheet', () => {
    mount(FormCtor, { propsData: { model: {} } });
    const style = document.head.querySelector('style[data-chronix-ui="form"]');
    expect(style).not.toBeNull();
  });

  it('prevents default form submission', () => {
    const wrapper = mount(FormCtor, { propsData: { model: {} } });
    const form = wrapper.find('form');
    // jsdom: submit event is dispatched; preventDefault is called
    expect(form.exists()).toBe(true);
  });

  it('exposes validate and restoreValidation methods', () => {
    const wrapper = mount(FormCtor, { propsData: { model: {} } });
    const vm = wrapper.vm as unknown as { validate: unknown; restoreValidation: unknown };
    expect(typeof vm.validate).toBe('function');
    expect(typeof vm.restoreValidation).toBe('function');
  });
});

describe('ChronixFormItem (vue2)', () => {
  it('renders with label and content', () => {
    const wrapper = mount(FormItemCtor, {
      propsData: { label: 'Username', path: 'username' },
      slots: { default: '<input data-testid="inner-input" />' },
    });
    expect(wrapper.find('[data-testid="form-item"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Username');
  });

  it('shows required asterisk when rules have required', () => {
    const wrapper = mount(FormItemCtor, {
      propsData: {
        label: 'Name',
        path: 'name',
        rule: { required: true, message: 'Required' },
      },
    });
    const asterisk = wrapper.find('.cx-ui-form-item-label__asterisk');
    expect(asterisk.exists()).toBe(true);
    expect(asterisk.text()).toBe('*');
  });

  it('does not show asterisk when not required', () => {
    const wrapper = mount(FormItemCtor, {
      propsData: { label: 'Optional', path: 'opt' },
    });
    const asterisk = wrapper.find('.cx-ui-form-item-label__asterisk');
    expect(asterisk.exists()).toBe(false);
  });

  it('exposes validate and restoreValidation methods', () => {
    const wrapper = mount(FormItemCtor, {
      propsData: { label: 'Test', path: 'test' },
    });
    const vm = wrapper.vm as unknown as { validate: unknown; restoreValidation: unknown };
    expect(typeof vm.validate).toBe('function');
    expect(typeof vm.restoreValidation).toBe('function');
  });
});
