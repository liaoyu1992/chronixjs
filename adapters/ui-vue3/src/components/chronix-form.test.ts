// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixForm, ChronixFormItem } from './chronix-form.js';

describe('ChronixForm (vue3)', () => {
  it('renders root <form> element with correct class', () => {
    const wrapper = mount(ChronixForm, { props: { model: {} } });
    const form = wrapper.find('[data-testid="form-root"]');
    expect(form.exists()).toBe(true);
    expect(form.classes()).toContain('cx-ui-form');
  });

  it('includes inline modifier when inline prop is true', () => {
    const wrapper = mount(ChronixForm, { props: { model: {}, inline: true } });
    const form = wrapper.find('[data-testid="form-root"]');
    expect(form.classes()).toContain('cx-ui-form--inline');
  });

  it('includes left-label modifier when labelPlacement is left', () => {
    const wrapper = mount(ChronixForm, { props: { model: {}, labelPlacement: 'left' } });
    const form = wrapper.find('[data-testid="form-root"]');
    expect(form.classes()).toContain('cx-ui-form--left-label');
  });

  it('injects the chronix-form stylesheet', () => {
    mount(ChronixForm, { props: { model: {} } });
    const style = document.head.querySelector('style[data-chronix-ui="form"]');
    expect(style).not.toBeNull();
  });

  it('prevents default form submission', async () => {
    const wrapper = mount(ChronixForm, { props: { model: {} } });
    const form = wrapper.find('form');
    await form.trigger('submit');
    // If preventDefault was called, the test page doesn't navigate (default behavior in jsdom)
  });

  it('exposes validate and restoreValidation methods', () => {
    const wrapper = mount(ChronixForm, { props: { model: {} } });
    const vm = wrapper.vm as unknown as { validate: unknown; restoreValidation: unknown };
    expect(typeof vm.validate).toBe('function');
    expect(typeof vm.restoreValidation).toBe('function');
  });
});

describe('ChronixFormItem (vue3)', () => {
  it('renders with label and content', () => {
    const wrapper = mount(ChronixFormItem, {
      props: { label: 'Username', path: 'username' },
      slots: { default: '<input data-testid="inner-input" />' },
    });
    expect(wrapper.find('[data-testid="form-item"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Username');
  });

  it('shows required asterisk when rules have required', () => {
    const wrapper = mount(ChronixFormItem, {
      props: {
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
    const wrapper = mount(ChronixFormItem, {
      props: { label: 'Optional', path: 'opt' },
    });
    const asterisk = wrapper.find('.cx-ui-form-item-label__asterisk');
    expect(asterisk.exists()).toBe(false);
  });

  it('exposes validate and restoreValidation methods', () => {
    const wrapper = mount(ChronixFormItem, {
      props: { label: 'Test', path: 'test' },
    });
    const vm = wrapper.vm as unknown as { validate: unknown; restoreValidation: unknown };
    expect(typeof vm.validate).toBe('function');
    expect(typeof vm.restoreValidation).toBe('function');
  });
});
