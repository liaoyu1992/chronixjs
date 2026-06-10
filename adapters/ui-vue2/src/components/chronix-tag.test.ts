import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixUIProvider } from '../providers/chronix-ui-provider.js';

import { ChronixTag } from './chronix-tag.js';

/**
 * Phase 13 (2026-06-02) — Tag mount tests (vue2). Verbatim port of
 * the vue3 Tag suite to `@vue/test-utils@1.x`. The `VueConstructor`
 * cast bridges Vue 2.7's `defineComponent` return type (Vue 3-style)
 * to vue-test-utils v1's call signature.
 */

const Tag = ChronixTag as unknown as VueConstructor;
const Provider = ChronixUIProvider as unknown as VueConstructor;

describe('ChronixTag (vue2) — default rendering', () => {
  it('renders a <span> with base + default-type + bordered + medium classes', () => {
    const wrapper = mount(Tag, { slots: { default: 'Hello' } });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-tag');
    expect(wrapper.classes()).toContain('cx-ui-tag--default');
    expect(wrapper.classes()).toContain('cx-ui-tag--medium');
    expect(wrapper.classes()).toContain('cx-ui-tag--bordered');
  });

  it('renders default slot content as tag label', () => {
    const wrapper = mount(Tag, { slots: { default: 'New' } });
    expect(wrapper.text()).toBe('New');
  });
});

describe('ChronixTag (vue2) — type prop', () => {
  it.each(['default', 'primary', 'info', 'success', 'warning', 'error'] as const)(
    'type="%s" adds the corresponding modifier class',
    (t) => {
      const wrapper = mount(Tag, { propsData: { type: t } });
      expect(wrapper.classes()).toContain(`cx-ui-tag--${t}`);
    },
  );
});

describe('ChronixTag (vue2) — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)(
    'size="%s" adds the corresponding modifier',
    (s) => {
      const wrapper = mount(Tag, { propsData: { size: s } });
      expect(wrapper.classes()).toContain(`cx-ui-tag--${s}`);
    },
  );

  it('falls back to context size when size prop is omitted', () => {
    const wrapper = mount(Tag);
    expect(wrapper.classes()).toContain('cx-ui-tag--medium');
  });
});

describe('ChronixTag (vue2) — bordered / round / closable modifiers', () => {
  it('bordered=false removes --bordered class', () => {
    const wrapper = mount(Tag, { propsData: { bordered: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-tag--bordered');
  });

  it('round=true adds --round class', () => {
    const wrapper = mount(Tag, { propsData: { round: true } });
    expect(wrapper.classes()).toContain('cx-ui-tag--round');
  });

  it('closable=true renders the __close button + adds --closable modifier', () => {
    const wrapper = mount(Tag, { propsData: { closable: true } });
    expect(wrapper.classes()).toContain('cx-ui-tag--closable');
    const close = wrapper.find('.cx-ui-tag__close');
    expect(close.exists()).toBe(true);
    expect(close.attributes('aria-label')).toBe('Close');
  });
});

describe('ChronixTag (vue2) — disabled prop', () => {
  it('disabled=true adds --disabled class', () => {
    const wrapper = mount(Tag, { propsData: { disabled: true } });
    expect(wrapper.classes()).toContain('cx-ui-tag--disabled');
  });

  it('inherits disabled from <ChronixUIProvider :disabled="true">', () => {
    const wrapper = mount(Provider, {
      propsData: { disabled: true },
      slots: { default: Tag as never },
    });
    expect(wrapper.find('.cx-ui-tag').classes()).toContain('cx-ui-tag--disabled');
  });
});

describe('ChronixTag (vue2) — close event', () => {
  it('emits close when the close button is clicked', async () => {
    const wrapper = mount(Tag, { propsData: { closable: true } });
    await wrapper.find('.cx-ui-tag__close').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('suppresses close when disabled', async () => {
    const wrapper = mount(Tag, { propsData: { closable: true, disabled: true } });
    await wrapper.find('.cx-ui-tag__close').trigger('click');
    expect(wrapper.emitted('close')).toBeUndefined();
  });
});

describe('ChronixTag (vue2) — CSS injection', () => {
  it('mounting any tag ensures the chronix-tag stylesheet is in document.head', () => {
    mount(Tag);
    const style = document.head.querySelector('style[data-chronix-ui="tag"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-tag');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    mount(Tag);
    mount(Tag);
    mount(Tag);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="tag"]');
    expect(styles.length).toBe(1);
  });
});
