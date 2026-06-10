import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixFlex } from './chronix-flex.js';

describe('ChronixFlex — default rendering', () => {
  it('renders a <div> with base + direction-row + wrap-nowrap', () => {
    const wrapper = mount(ChronixFlex);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-flex');
    expect(wrapper.classes()).toContain('cx-ui-flex--direction-row');
    expect(wrapper.classes()).toContain('cx-ui-flex--wrap-nowrap');
  });

  it('omits inline-style gap when gap prop is undefined', () => {
    const wrapper = mount(ChronixFlex);
    const style = wrapper.attributes('style') ?? '';
    expect(style).not.toMatch(/gap:/);
  });

  it('renders the default slot children', () => {
    const wrapper = mount(ChronixFlex, {
      slots: { default: '<span class="child">child</span>' },
    });
    expect(wrapper.find('.child').text()).toBe('child');
  });
});

describe('ChronixFlex — direction prop', () => {
  it.each(['row', 'column', 'row-reverse', 'column-reverse'] as const)(
    'direction="%s" adds the matching modifier',
    (d) => {
      const wrapper = mount(ChronixFlex, { props: { direction: d } });
      expect(wrapper.classes()).toContain(`cx-ui-flex--direction-${d}`);
    },
  );
});

describe('ChronixFlex — wrap prop', () => {
  it.each(['nowrap', 'wrap', 'wrap-reverse'] as const)(
    'wrap="%s" adds the matching modifier',
    (w) => {
      const wrapper = mount(ChronixFlex, { props: { wrap: w } });
      expect(wrapper.classes()).toContain(`cx-ui-flex--wrap-${w}`);
    },
  );
});

describe('ChronixFlex — gap prop', () => {
  it.each(['small', 'medium', 'large'] as const)('gap="%s" applies token-fallback CSS-var', (g) => {
    const wrapper = mount(ChronixFlex, { props: { gap: g } });
    expect(wrapper.attributes('style')).toContain(`--cx-ui-space-gap-${g}`);
  });

  it('numeric gap applies inline style "gap: Npx"', () => {
    const wrapper = mount(ChronixFlex, { props: { gap: 16 } });
    expect(wrapper.attributes('style')).toMatch(/gap:\s*16px/);
  });
});

describe('ChronixFlex — align + justify + inline modifiers', () => {
  it('align="center" adds the matching modifier', () => {
    const wrapper = mount(ChronixFlex, { props: { align: 'center' } });
    expect(wrapper.classes()).toContain('cx-ui-flex--align-center');
  });

  it('justify="space-around" adds the matching modifier', () => {
    const wrapper = mount(ChronixFlex, { props: { justify: 'space-around' } });
    expect(wrapper.classes()).toContain('cx-ui-flex--justify-space-around');
  });

  it('adds --inline when inline=true', () => {
    const wrapper = mount(ChronixFlex, { props: { inline: true } });
    expect(wrapper.classes()).toContain('cx-ui-flex--inline');
  });
});

describe('ChronixFlex — CSS injection', () => {
  it('mounting ensures the chronix-flex stylesheet is in document.head', () => {
    mount(ChronixFlex);
    expect(document.head.querySelector('style[data-chronix-ui="flex"]')).not.toBeNull();
  });
});
