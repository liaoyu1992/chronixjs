import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixSpace } from './chronix-space.js';

const Space = ChronixSpace as unknown as VueConstructor;

describe('ChronixSpace (vue2) — default rendering', () => {
  it('renders a <div> with base + wrap class', () => {
    const wrapper = mount(Space);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-space');
    expect(wrapper.classes()).toContain('cx-ui-space--wrap');
  });

  it('applies inline style gap from the medium token default', () => {
    const wrapper = mount(Space);
    expect(wrapper.attributes('style')).toContain('gap: var(--cx-ui-space-gap-medium, 12px)');
  });

  it('renders the default slot children', () => {
    const wrapper = mount(Space, {
      slots: { default: '<span class="child">child</span>' },
    });
    expect(wrapper.find('.child').text()).toBe('child');
  });
});

describe('ChronixSpace (vue2) — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" produces token-fallback gap', (s) => {
    const wrapper = mount(Space, { propsData: { size: s } });
    expect(wrapper.attributes('style')).toContain(`--cx-ui-space-gap-${s}`);
  });

  it('numeric size applies inline style "gap: Npx"', () => {
    const wrapper = mount(Space, { propsData: { size: 20 } });
    expect(wrapper.attributes('style')).toMatch(/gap:\s*20px/);
  });
});

describe('ChronixSpace (vue2) — modifiers', () => {
  it('adds --vertical when vertical=true', () => {
    const wrapper = mount(Space, { propsData: { vertical: true } });
    expect(wrapper.classes()).toContain('cx-ui-space--vertical');
  });

  it('omits --wrap when wrap=false', () => {
    const wrapper = mount(Space, { propsData: { wrap: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-space--wrap');
  });

  it('adds --inline when inline=true', () => {
    const wrapper = mount(Space, { propsData: { inline: true } });
    expect(wrapper.classes()).toContain('cx-ui-space--inline');
  });

  it.each(['start', 'center', 'end', 'baseline', 'stretch'] as const)(
    'align="%s" adds the matching modifier',
    (a) => {
      const wrapper = mount(Space, { propsData: { align: a } });
      expect(wrapper.classes()).toContain(`cx-ui-space--align-${a}`);
    },
  );

  it('justify="space-between" adds the matching modifier', () => {
    const wrapper = mount(Space, { propsData: { justify: 'space-between' } });
    expect(wrapper.classes()).toContain('cx-ui-space--justify-space-between');
  });
});

describe('ChronixSpace (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-space stylesheet is in document.head', () => {
    mount(Space);
    expect(document.head.querySelector('style[data-chronix-ui="space"]')).not.toBeNull();
  });
});
