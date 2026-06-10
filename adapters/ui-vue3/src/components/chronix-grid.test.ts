import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixGrid } from './chronix-grid.js';

describe('ChronixGrid — default rendering', () => {
  it('renders a <div> with base class only', () => {
    const wrapper = mount(ChronixGrid);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-grid');
  });

  it('omits all inline-style declarations when all props are undefined', () => {
    const wrapper = mount(ChronixGrid);
    const style = wrapper.attributes('style') ?? '';
    expect(style).not.toMatch(/grid-template-columns/);
    expect(style).not.toMatch(/column-gap/);
    expect(style).not.toMatch(/row-gap/);
  });

  it('renders the default slot children', () => {
    const wrapper = mount(ChronixGrid, {
      slots: { default: '<span class="child">child</span>' },
    });
    expect(wrapper.find('.child').text()).toBe('child');
  });
});

describe('ChronixGrid — cols prop', () => {
  it('numeric cols renders grid-template-columns: repeat(N, minmax(0, 1fr))', () => {
    const wrapper = mount(ChronixGrid, { props: { cols: 4 } });
    expect(wrapper.attributes('style')).toMatch(
      /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
    );
  });

  it('string cols passes verbatim', () => {
    const wrapper = mount(ChronixGrid, { props: { cols: '120px 1fr 120px' } });
    expect(wrapper.attributes('style')).toMatch(/grid-template-columns:\s*120px 1fr 120px/);
  });

  it('cols=0 collapses to no inline declaration (helper-side guard)', () => {
    const wrapper = mount(ChronixGrid, { props: { cols: 0 } });
    expect(wrapper.attributes('style') ?? '').not.toMatch(/grid-template-columns/);
  });
});

describe('ChronixGrid — xGap + yGap props', () => {
  it('xGap applies inline style column-gap', () => {
    const wrapper = mount(ChronixGrid, { props: { xGap: 16 } });
    expect(wrapper.attributes('style')).toMatch(/column-gap:\s*16px/);
  });

  it('yGap applies inline style row-gap', () => {
    const wrapper = mount(ChronixGrid, { props: { yGap: 8 } });
    expect(wrapper.attributes('style')).toMatch(/row-gap:\s*8px/);
  });

  it('both xGap + yGap render together', () => {
    const wrapper = mount(ChronixGrid, { props: { xGap: 16, yGap: 8 } });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toMatch(/column-gap:\s*16px/);
    expect(style).toMatch(/row-gap:\s*8px/);
  });
});

describe('ChronixGrid — inline modifier', () => {
  it('adds --inline when inline=true', () => {
    const wrapper = mount(ChronixGrid, { props: { inline: true } });
    expect(wrapper.classes()).toContain('cx-ui-grid--inline');
  });
});

describe('ChronixGrid — CSS injection', () => {
  it('mounting ensures the chronix-grid stylesheet is in document.head', () => {
    mount(ChronixGrid);
    expect(document.head.querySelector('style[data-chronix-ui="grid"]')).not.toBeNull();
  });
});
