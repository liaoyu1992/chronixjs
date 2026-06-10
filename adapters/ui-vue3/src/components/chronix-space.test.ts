import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixSpace } from './chronix-space.js';

describe('ChronixSpace — default rendering', () => {
  it('renders a <div> with base + wrap class', () => {
    const wrapper = mount(ChronixSpace);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-space');
    expect(wrapper.classes()).toContain('cx-ui-space--wrap');
  });

  it('applies inline style gap from the medium token default', () => {
    const wrapper = mount(ChronixSpace);
    expect(wrapper.attributes('style')).toContain('gap: var(--cx-ui-space-gap-medium, 12px)');
  });

  it('renders the default slot children', () => {
    const wrapper = mount(ChronixSpace, {
      slots: { default: '<span class="child">child</span>' },
    });
    expect(wrapper.find('.child').text()).toBe('child');
  });
});

describe('ChronixSpace — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" produces token-fallback gap', (s) => {
    const wrapper = mount(ChronixSpace, { props: { size: s } });
    expect(wrapper.attributes('style')).toContain(`--cx-ui-space-gap-${s}`);
  });

  it('numeric size applies inline style "gap: Npx"', () => {
    const wrapper = mount(ChronixSpace, { props: { size: 20 } });
    expect(wrapper.attributes('style')).toMatch(/gap:\s*20px/);
  });
});

describe('ChronixSpace — direction + wrap + inline modifiers', () => {
  it('adds --vertical when vertical=true', () => {
    const wrapper = mount(ChronixSpace, { props: { vertical: true } });
    expect(wrapper.classes()).toContain('cx-ui-space--vertical');
  });

  it('omits --wrap when wrap=false', () => {
    const wrapper = mount(ChronixSpace, { props: { wrap: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-space--wrap');
  });

  it('adds --inline when inline=true', () => {
    const wrapper = mount(ChronixSpace, { props: { inline: true } });
    expect(wrapper.classes()).toContain('cx-ui-space--inline');
  });
});

describe('ChronixSpace — align + justify modifiers', () => {
  it.each(['start', 'center', 'end', 'baseline', 'stretch'] as const)(
    'align="%s" adds the matching modifier',
    (a) => {
      const wrapper = mount(ChronixSpace, { props: { align: a } });
      expect(wrapper.classes()).toContain(`cx-ui-space--align-${a}`);
    },
  );

  it('justify="space-between" adds the matching modifier', () => {
    const wrapper = mount(ChronixSpace, { props: { justify: 'space-between' } });
    expect(wrapper.classes()).toContain('cx-ui-space--justify-space-between');
  });
});

describe('ChronixSpace — CSS injection', () => {
  it('mounting ensures the chronix-space stylesheet is in document.head', () => {
    mount(ChronixSpace);
    expect(document.head.querySelector('style[data-chronix-ui="space"]')).not.toBeNull();
  });
});
