import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import { ChronixUIProvider } from '../providers/chronix-ui-provider.js';

import { ChronixButton } from './chronix-button.js';

describe('ChronixButton — default rendering', () => {
  it('renders a <button> element with the base class', () => {
    const wrapper = mount(ChronixButton, { slots: { default: 'Click me' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('BUTTON');
    expect(wrapper.classes()).toContain('cx-ui-button');
  });

  it('renders the default variant + medium size + button htmlType', () => {
    const wrapper = mount(ChronixButton);
    expect(wrapper.classes()).toContain('cx-ui-button--default');
    expect(wrapper.classes()).toContain('cx-ui-button--medium');
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('renders default slot content as button label', () => {
    const wrapper = mount(ChronixButton, { slots: { default: 'Submit' } });
    expect(wrapper.text()).toBe('Submit');
  });

  it('renders complex slot content (multiple nodes)', () => {
    const wrapper = mount(ChronixButton, {
      slots: { default: () => [h('span', 'A'), h('span', 'B')] },
    });
    expect(wrapper.text()).toBe('AB');
  });
});

describe('ChronixButton — variant prop', () => {
  it('primary variant adds --primary class', () => {
    const wrapper = mount(ChronixButton, { props: { variant: 'primary' } });
    expect(wrapper.classes()).toContain('cx-ui-button--primary');
    expect(wrapper.classes()).not.toContain('cx-ui-button--default');
  });
});

describe('ChronixButton — size prop', () => {
  it('size="small" applies --small class', () => {
    const wrapper = mount(ChronixButton, { props: { size: 'small' } });
    expect(wrapper.classes()).toContain('cx-ui-button--small');
  });

  it('size="large" applies --large class', () => {
    const wrapper = mount(ChronixButton, { props: { size: 'large' } });
    expect(wrapper.classes()).toContain('cx-ui-button--large');
  });

  it('size unspecified falls back to context size (default medium)', () => {
    const wrapper = mount(ChronixButton);
    expect(wrapper.classes()).toContain('cx-ui-button--medium');
  });
});

describe('ChronixButton — disabled prop', () => {
  it('disabled=true adds --disabled class + disabled attribute', () => {
    const wrapper = mount(ChronixButton, { props: { disabled: true } });
    expect(wrapper.classes()).toContain('cx-ui-button--disabled');
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-disabled')).toBe('true');
  });

  it('disabled=false (default) does not add --disabled class', () => {
    const wrapper = mount(ChronixButton);
    expect(wrapper.classes()).not.toContain('cx-ui-button--disabled');
    expect(wrapper.attributes('aria-disabled')).toBeUndefined();
  });
});

describe('ChronixButton — block prop', () => {
  it('block=true adds --block class', () => {
    const wrapper = mount(ChronixButton, { props: { block: true } });
    expect(wrapper.classes()).toContain('cx-ui-button--block');
  });
});

describe('ChronixButton — htmlType prop', () => {
  it('htmlType="submit" sets type attribute', () => {
    const wrapper = mount(ChronixButton, { props: { htmlType: 'submit' } });
    expect(wrapper.attributes('type')).toBe('submit');
  });

  it('htmlType="reset" sets type attribute', () => {
    const wrapper = mount(ChronixButton, { props: { htmlType: 'reset' } });
    expect(wrapper.attributes('type')).toBe('reset');
  });
});

describe('ChronixButton — click event', () => {
  it('emits click on user click', async () => {
    const wrapper = mount(ChronixButton);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('suppresses click when disabled', async () => {
    const wrapper = mount(ChronixButton, { props: { disabled: true } });
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});

describe('ChronixButton — context integration (ChronixUIProvider)', () => {
  it('inherits size from <ChronixUIProvider size="large">', () => {
    const wrapper = mount({
      components: { ChronixUIProvider, ChronixButton },
      template: `
        <ChronixUIProvider size="large">
          <ChronixButton />
        </ChronixUIProvider>
      `,
    });
    const button = wrapper.find('button');
    expect(button.classes()).toContain('cx-ui-button--large');
  });

  it('own size prop overrides provider size', () => {
    const wrapper = mount({
      components: { ChronixUIProvider, ChronixButton },
      template: `
        <ChronixUIProvider size="large">
          <ChronixButton size="small" />
        </ChronixUIProvider>
      `,
    });
    expect(wrapper.find('button').classes()).toContain('cx-ui-button--small');
  });

  it('inherits disabled from <ChronixUIProvider :disabled="true">', () => {
    const wrapper = mount({
      components: { ChronixUIProvider, ChronixButton },
      template: `
        <ChronixUIProvider :disabled="true">
          <ChronixButton />
        </ChronixUIProvider>
      `,
    });
    expect(wrapper.find('button').classes()).toContain('cx-ui-button--disabled');
  });

  it('provider root carries CSS-var inline styles for theme tokens', () => {
    const wrapper = mount({
      components: { ChronixUIProvider, ChronixButton },
      template: `
        <ChronixUIProvider>
          <ChronixButton />
        </ChronixUIProvider>
      `,
    });
    const providerRoot = wrapper.find('.cx-ui-provider');
    expect(providerRoot.exists()).toBe(true);
    const styleAttr = providerRoot.attributes('style') ?? '';
    expect(styleAttr).toContain('--cx-ui-primary-color');
    expect(styleAttr).toContain('--cx-ui-button-bg-color');
  });
});

describe('ChronixButton — CSS injection', () => {
  it('mounting any button ensures the chronix-button stylesheet is in document.head', () => {
    mount(ChronixButton);
    const style = document.head.querySelector('style[data-chronix-ui="button"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-button');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    mount(ChronixButton);
    mount(ChronixButton);
    mount(ChronixButton);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="button"]');
    expect(styles.length).toBe(1);
  });
});
