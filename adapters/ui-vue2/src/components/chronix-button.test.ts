import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Vue, { h, type VueConstructor } from 'vue';

import { ChronixUIProvider } from '../providers/chronix-ui-provider.js';

import { ChronixButton } from './chronix-button.js';

/**
 * Vue 2.7's `defineComponent` returns a Vue 3 `DefineComponent` for IDE
 * prop-inference, but `@vue/test-utils@1.x`'s `mount` is typed for
 * Vue 2's `VueConstructor`. Runtime is identical (`defineComponent`
 * IS `Vue.extend` under the hood). Cast through `VueConstructor` to
 * satisfy the call-site signature without changing runtime shape.
 * Matches the chronix-table-vue2 test cast at
 * `adapters/table-vue2/src/chronix-table.test.ts:34`.
 */
const Button = ChronixButton as unknown as VueConstructor;
const Provider = ChronixUIProvider as unknown as VueConstructor;

/**
 * — vue2 port of the 21-case vue3 mount
 * test suite. Same assertions, same DOM-shape expectations; only the
 * test-utils API differs (vue-test-utils v1 vs v2). Parity-by-port:
 * any divergence here is a chronix-ui regression, not a vue2-isms
 * artifact.
 */

describe('ChronixButton (vue2) — default rendering', () => {
  it('renders a <button> element with the base class', () => {
    const wrapper = mount(Button, { slots: { default: 'Click me' } });
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.classes()).toContain('cx-ui-button');
  });

  it('renders the default variant + medium size + button htmlType', () => {
    const wrapper = mount(Button);
    expect(wrapper.classes()).toContain('cx-ui-button--default');
    expect(wrapper.classes()).toContain('cx-ui-button--medium');
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('renders default slot content as button label', () => {
    const wrapper = mount(Button, { slots: { default: 'Submit' } });
    expect(wrapper.text()).toBe('Submit');
  });

  it('renders complex slot content (multiple nodes)', () => {
    // vue-test-utils v1 expects slot-content as a render-function array
    // wrapped in a parent functional component, or as `h(...)`-returning
    // functions. Use Vue.extend with a render fn to mirror the vue3
    // multi-VNode test.
    const Wrapper = Vue.extend({
      render() {
        return h(Button, [h('span', 'A'), h('span', 'B')]);
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.text()).toBe('AB');
  });
});

describe('ChronixButton (vue2) — variant prop', () => {
  it('primary variant adds --primary class', () => {
    const wrapper = mount(Button, { propsData: { variant: 'primary' } });
    expect(wrapper.classes()).toContain('cx-ui-button--primary');
    expect(wrapper.classes()).not.toContain('cx-ui-button--default');
  });
});

describe('ChronixButton (vue2) — size prop', () => {
  it('size="small" applies --small class', () => {
    const wrapper = mount(Button, { propsData: { size: 'small' } });
    expect(wrapper.classes()).toContain('cx-ui-button--small');
  });

  it('size="large" applies --large class', () => {
    const wrapper = mount(Button, { propsData: { size: 'large' } });
    expect(wrapper.classes()).toContain('cx-ui-button--large');
  });

  it('size unspecified falls back to context size (default medium)', () => {
    const wrapper = mount(Button);
    expect(wrapper.classes()).toContain('cx-ui-button--medium');
  });
});

describe('ChronixButton (vue2) — disabled prop', () => {
  it('disabled=true adds --disabled class + disabled attribute', () => {
    const wrapper = mount(Button, { propsData: { disabled: true } });
    expect(wrapper.classes()).toContain('cx-ui-button--disabled');
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-disabled')).toBe('true');
  });

  it('disabled=false (default) does not add --disabled class', () => {
    const wrapper = mount(Button);
    expect(wrapper.classes()).not.toContain('cx-ui-button--disabled');
    expect(wrapper.attributes('aria-disabled')).toBeUndefined();
  });
});

describe('ChronixButton (vue2) — block prop', () => {
  it('block=true adds --block class', () => {
    const wrapper = mount(Button, { propsData: { block: true } });
    expect(wrapper.classes()).toContain('cx-ui-button--block');
  });
});

describe('ChronixButton (vue2) — htmlType prop', () => {
  it('htmlType="submit" sets type attribute', () => {
    const wrapper = mount(Button, { propsData: { htmlType: 'submit' } });
    expect(wrapper.attributes('type')).toBe('submit');
  });

  it('htmlType="reset" sets type attribute', () => {
    const wrapper = mount(Button, { propsData: { htmlType: 'reset' } });
    expect(wrapper.attributes('type')).toBe('reset');
  });
});

describe('ChronixButton (vue2) — click event', () => {
  it('emits click on user click', async () => {
    const wrapper = mount(Button);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('suppresses click when disabled', async () => {
    const wrapper = mount(Button, { propsData: { disabled: true } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});

describe('ChronixButton (vue2) — context integration (ChronixUIProvider)', () => {
  it('inherits size from <ChronixUIProvider size="large">', () => {
    const wrapper = mount(Provider, {
      propsData: { size: 'large' },
      slots: { default: Button as never },
    });
    const button = wrapper.find('button');
    expect(button.classes()).toContain('cx-ui-button--large');
  });

  it('own size prop overrides provider size', () => {
    const Wrapper = Vue.extend({
      render() {
        return h(Provider, { props: { size: 'large' } }, [h(Button, { props: { size: 'small' } })]);
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('button').classes()).toContain('cx-ui-button--small');
  });

  it('inherits disabled from <ChronixUIProvider :disabled="true">', () => {
    const wrapper = mount(Provider, {
      propsData: { disabled: true },
      slots: { default: Button as never },
    });
    expect(wrapper.find('button').classes()).toContain('cx-ui-button--disabled');
  });

  it('provider root carries CSS-var inline styles for theme tokens', () => {
    const wrapper = mount(Provider, {
      slots: { default: Button as never },
    });
    const providerRoot = wrapper.find('.cx-ui-provider');
    expect(providerRoot.exists()).toBe(true);
    const styleAttr = providerRoot.attributes('style') ?? '';
    expect(styleAttr).toContain('--cx-ui-primary-color');
    expect(styleAttr).toContain('--cx-ui-button-bg-color');
  });
});

describe('ChronixButton (vue2) — CSS injection', () => {
  it('mounting any button ensures the chronix-button stylesheet is in document.head', () => {
    mount(Button);
    const style = document.head.querySelector('style[data-chronix-ui="button"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-button');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    mount(Button);
    mount(Button);
    mount(Button);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="button"]');
    expect(styles.length).toBe(1);
  });
});
