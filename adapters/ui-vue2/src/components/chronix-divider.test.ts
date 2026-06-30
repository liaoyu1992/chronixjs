import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixDivider } from './chronix-divider.js';

const Divider = ChronixDivider as unknown as VueConstructor;

/**
 * — Divider mount tests (vue2). Verbatim port
 * of the vue3 Divider suite to `@vue/test-utils@1.x`.
 */

describe('ChronixDivider (vue2) — default rendering', () => {
  it('renders a <div> with role="separator" and horizontal class', () => {
    const wrapper = mount(Divider);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBe('separator');
    expect(wrapper.classes()).toContain('cx-ui-divider');
    expect(wrapper.classes()).toContain('cx-ui-divider--horizontal');
  });

  it('omits --with-title and __title element when no slot content is supplied', () => {
    const wrapper = mount(Divider);
    expect(wrapper.classes()).not.toContain('cx-ui-divider--with-title');
    expect(wrapper.find('.cx-ui-divider__title').exists()).toBe(false);
  });
});

describe('ChronixDivider (vue2) — title slot', () => {
  it('renders a __title span and adds --with-title + --title-center when default slot is non-empty', () => {
    const wrapper = mount(Divider, { slots: { default: 'Title' } });
    expect(wrapper.classes()).toContain('cx-ui-divider--with-title');
    expect(wrapper.classes()).toContain('cx-ui-divider--title-center');
    const title = wrapper.find('.cx-ui-divider__title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('Title');
  });

  it.each(['left', 'center', 'right'] as const)(
    'titlePlacement="%s" adds the matching modifier when title is present',
    (p) => {
      const wrapper = mount(Divider, {
        propsData: { titlePlacement: p },
        slots: { default: 'T' },
      });
      expect(wrapper.classes()).toContain(`cx-ui-divider--title-${p}`);
    },
  );
});

describe('ChronixDivider (vue2) — vertical mode', () => {
  it('vertical=true emits --vertical (not --horizontal)', () => {
    const wrapper = mount(Divider, { propsData: { vertical: true } });
    expect(wrapper.classes()).toContain('cx-ui-divider--vertical');
    expect(wrapper.classes()).not.toContain('cx-ui-divider--horizontal');
  });

  it('vertical=true suppresses title slot rendering even when slot is supplied', () => {
    const wrapper = mount(Divider, {
      propsData: { vertical: true },
      slots: { default: 'should-not-appear' },
    });
    expect(wrapper.classes()).not.toContain('cx-ui-divider--with-title');
    expect(wrapper.find('.cx-ui-divider__title').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });
});

describe('ChronixDivider (vue2) — dashed prop', () => {
  it('dashed=true adds --dashed class', () => {
    const wrapper = mount(Divider, { propsData: { dashed: true } });
    expect(wrapper.classes()).toContain('cx-ui-divider--dashed');
  });
});

describe('ChronixDivider (vue2) — CSS injection', () => {
  it('mounting any divider ensures the chronix-divider stylesheet is in document.head', () => {
    mount(Divider);
    const style = document.head.querySelector('style[data-chronix-ui="divider"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-divider');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    mount(Divider);
    mount(Divider);
    mount(Divider);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="divider"]');
    expect(styles.length).toBe(1);
  });
});
