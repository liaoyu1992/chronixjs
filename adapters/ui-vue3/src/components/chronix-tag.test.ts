import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixUIProvider } from '../providers/chronix-ui-provider.js';

import { ChronixTag } from './chronix-tag.js';

/**
 * — Tag mount tests (vue3). Mirrors the Phase
 * 11 Button suite shape but adapts to Tag's prop surface (6 types
 * instead of 2 variants; `closable` / `bordered` / `round` / `disabled`
 * modifiers; close-event emission).
 */

describe('ChronixTag — default rendering', () => {
  it('renders a <span> element with the base + default-type + bordered + medium classes', () => {
    const wrapper = mount(ChronixTag, { slots: { default: 'Hello' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-tag');
    expect(wrapper.classes()).toContain('cx-ui-tag--default');
    expect(wrapper.classes()).toContain('cx-ui-tag--medium');
    expect(wrapper.classes()).toContain('cx-ui-tag--bordered');
  });

  it('renders default slot content as tag label', () => {
    const wrapper = mount(ChronixTag, { slots: { default: 'New' } });
    expect(wrapper.text()).toBe('New');
  });
});

describe('ChronixTag — type prop', () => {
  it.each(['default', 'primary', 'info', 'success', 'warning', 'error'] as const)(
    'type="%s" adds the corresponding modifier class',
    (t) => {
      const wrapper = mount(ChronixTag, { props: { type: t } });
      expect(wrapper.classes()).toContain(`cx-ui-tag--${t}`);
    },
  );
});

describe('ChronixTag — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)(
    'size="%s" adds the corresponding modifier',
    (s) => {
      const wrapper = mount(ChronixTag, { props: { size: s } });
      expect(wrapper.classes()).toContain(`cx-ui-tag--${s}`);
    },
  );

  it('falls back to context size when size prop is omitted', () => {
    const wrapper = mount(ChronixTag);
    expect(wrapper.classes()).toContain('cx-ui-tag--medium');
  });
});

describe('ChronixTag — bordered / round / closable modifiers', () => {
  it('bordered=false removes --bordered class', () => {
    const wrapper = mount(ChronixTag, { props: { bordered: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-tag--bordered');
  });

  it('round=true adds --round class', () => {
    const wrapper = mount(ChronixTag, { props: { round: true } });
    expect(wrapper.classes()).toContain('cx-ui-tag--round');
  });

  it('closable=true renders the __close button + adds --closable modifier', () => {
    const wrapper = mount(ChronixTag, { props: { closable: true } });
    expect(wrapper.classes()).toContain('cx-ui-tag--closable');
    const close = wrapper.find('.cx-ui-tag__close');
    expect(close.exists()).toBe(true);
    expect(close.attributes('aria-label')).toBe('Close');
  });
});

describe('ChronixTag — disabled prop', () => {
  it('disabled=true adds --disabled class', () => {
    const wrapper = mount(ChronixTag, { props: { disabled: true } });
    expect(wrapper.classes()).toContain('cx-ui-tag--disabled');
  });

  it('inherits disabled from <ChronixUIProvider :disabled="true">', () => {
    const wrapper = mount({
      components: { ChronixUIProvider, ChronixTag },
      template: `
        <ChronixUIProvider :disabled="true">
          <ChronixTag />
        </ChronixUIProvider>
      `,
    });
    expect(wrapper.find('.cx-ui-tag').classes()).toContain('cx-ui-tag--disabled');
  });
});

describe('ChronixTag — close event', () => {
  it('emits close when the close button is clicked', async () => {
    const wrapper = mount(ChronixTag, { props: { closable: true } });
    await wrapper.find('.cx-ui-tag__close').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('suppresses close when disabled', async () => {
    const wrapper = mount(ChronixTag, { props: { closable: true, disabled: true } });
    await wrapper.find('.cx-ui-tag__close').trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();
  });
});

describe('ChronixTag — CSS injection', () => {
  it('mounting any tag ensures the chronix-tag stylesheet is in document.head', () => {
    mount(ChronixTag);
    const style = document.head.querySelector('style[data-chronix-ui="tag"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-tag');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    mount(ChronixTag);
    mount(ChronixTag);
    mount(ChronixTag);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="tag"]');
    expect(styles.length).toBe(1);
  });
});
