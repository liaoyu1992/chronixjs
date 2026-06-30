import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixDivider } from './chronix-divider.js';

/**
 * — Divider mount tests (vue3). Mirrors the
 * core's `resolveDividerClassList` test pairs to confirm the SFC
 * wires through identical class sets + correct DOM-level role
 * semantics.
 */

describe('ChronixDivider — default rendering', () => {
  it('renders a <div> with role="separator" and horizontal class', () => {
    const wrapper = mount(ChronixDivider);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBe('separator');
    expect(wrapper.classes()).toContain('cx-ui-divider');
    expect(wrapper.classes()).toContain('cx-ui-divider--horizontal');
  });

  it('omits --with-title and __title element when no slot content is supplied', () => {
    const wrapper = mount(ChronixDivider);
    expect(wrapper.classes()).not.toContain('cx-ui-divider--with-title');
    expect(wrapper.find('.cx-ui-divider__title').exists()).toBe(false);
  });
});

describe('ChronixDivider — title slot', () => {
  it('renders a __title span and adds --with-title + --title-center when default slot is non-empty', () => {
    const wrapper = mount(ChronixDivider, { slots: { default: 'Title' } });
    expect(wrapper.classes()).toContain('cx-ui-divider--with-title');
    expect(wrapper.classes()).toContain('cx-ui-divider--title-center');
    const title = wrapper.find('.cx-ui-divider__title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('Title');
  });

  it.each(['left', 'center', 'right'] as const)(
    'titlePlacement="%s" adds the matching modifier when title is present',
    (p) => {
      const wrapper = mount(ChronixDivider, {
        props: { titlePlacement: p },
        slots: { default: 'T' },
      });
      expect(wrapper.classes()).toContain(`cx-ui-divider--title-${p}`);
    },
  );
});

describe('ChronixDivider — vertical mode', () => {
  it('vertical=true emits --vertical (not --horizontal)', () => {
    const wrapper = mount(ChronixDivider, { props: { vertical: true } });
    expect(wrapper.classes()).toContain('cx-ui-divider--vertical');
    expect(wrapper.classes()).not.toContain('cx-ui-divider--horizontal');
  });

  it('vertical=true suppresses title slot rendering even when slot is supplied', () => {
    const wrapper = mount(ChronixDivider, {
      props: { vertical: true },
      slots: { default: 'should-not-appear' },
    });
    expect(wrapper.classes()).not.toContain('cx-ui-divider--with-title');
    expect(wrapper.find('.cx-ui-divider__title').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });
});

describe('ChronixDivider — dashed prop', () => {
  it('dashed=true adds --dashed class', () => {
    const wrapper = mount(ChronixDivider, { props: { dashed: true } });
    expect(wrapper.classes()).toContain('cx-ui-divider--dashed');
  });
});

describe('ChronixDivider — CSS injection', () => {
  it('mounting any divider ensures the chronix-divider stylesheet is in document.head', () => {
    mount(ChronixDivider);
    const style = document.head.querySelector('style[data-chronix-ui="divider"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-divider');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    mount(ChronixDivider);
    mount(ChronixDivider);
    mount(ChronixDivider);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="divider"]');
    expect(styles.length).toBe(1);
  });
});
