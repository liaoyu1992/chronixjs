import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixTypography } from './chronix-typography.js';

describe('ChronixTypography (vue3)', () => {
  it('renders <span> + --text for default variant', () => {
    const wrapper = mount(ChronixTypography, { slots: { default: 'hello' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-typography--text');
  });

  it('renders <h3> + --title --level-3 for variant=title level=3', () => {
    const wrapper = mount(ChronixTypography, {
      props: { variant: 'title', level: 3 },
      slots: { default: 'h3' },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('H3');
    expect(wrapper.classes()).toContain('cx-ui-typography--title');
    expect(wrapper.classes()).toContain('cx-ui-typography--level-3');
  });

  it('renders <hr> for variant=hr', () => {
    const wrapper = mount(ChronixTypography, { props: { variant: 'hr' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('HR');
  });

  it('adds --italic and --underline modifiers', () => {
    const wrapper = mount(ChronixTypography, {
      props: { italic: true, underline: true },
      slots: { default: 'styled' },
    });
    expect(wrapper.classes()).toContain('cx-ui-typography--italic');
    expect(wrapper.classes()).toContain('cx-ui-typography--underline');
  });

  it('injects the chronix-typography stylesheet', () => {
    mount(ChronixTypography);
    expect(document.head.querySelector('style[data-chronix-ui="typography"]')).not.toBeNull();
  });
});
