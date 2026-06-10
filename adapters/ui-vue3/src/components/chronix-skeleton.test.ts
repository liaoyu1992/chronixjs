import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixSkeleton } from './chronix-skeleton.js';

describe('ChronixSkeleton — default rendering', () => {
  it('renders a <div> with base + text + animated', () => {
    const wrapper = mount(ChronixSkeleton);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-skeleton');
    expect(wrapper.classes()).toContain('cx-ui-skeleton--text');
    expect(wrapper.classes()).toContain('cx-ui-skeleton--animated');
  });

  it('emits no inline width/height when undefined', () => {
    const wrapper = mount(ChronixSkeleton);
    const style = wrapper.attributes('style') ?? '';
    expect(style).not.toMatch(/width:/);
    expect(style).not.toMatch(/height:/);
  });
});

describe('ChronixSkeleton — shape prop', () => {
  it.each(['text', 'rect', 'circle'] as const)('shape="%s" adds the matching modifier', (s) => {
    const wrapper = mount(ChronixSkeleton, { props: { shape: s } });
    expect(wrapper.classes()).toContain(`cx-ui-skeleton--${s}`);
  });
});

describe('ChronixSkeleton — width/height props', () => {
  it('numeric width becomes Npx', () => {
    const wrapper = mount(ChronixSkeleton, { props: { width: 200 } });
    expect(wrapper.attributes('style')).toMatch(/width:\s*200px/);
  });

  it('numeric height becomes Npx', () => {
    const wrapper = mount(ChronixSkeleton, { props: { height: 60 } });
    expect(wrapper.attributes('style')).toMatch(/height:\s*60px/);
  });

  it('string width passes through verbatim', () => {
    const wrapper = mount(ChronixSkeleton, { props: { width: '50%' } });
    expect(wrapper.attributes('style')).toMatch(/width:\s*50%/);
  });

  it('both width + height render together', () => {
    const wrapper = mount(ChronixSkeleton, { props: { width: 100, height: 40 } });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toMatch(/width:\s*100px/);
    expect(style).toMatch(/height:\s*40px/);
  });
});

describe('ChronixSkeleton — animated + round modifiers', () => {
  it('omits --animated when animated=false', () => {
    const wrapper = mount(ChronixSkeleton, { props: { animated: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-skeleton--animated');
  });

  it('adds --round when round=true', () => {
    const wrapper = mount(ChronixSkeleton, { props: { round: true } });
    expect(wrapper.classes()).toContain('cx-ui-skeleton--round');
  });
});

describe('ChronixSkeleton — CSS injection', () => {
  it('mounting ensures the chronix-skeleton stylesheet is in document.head', () => {
    mount(ChronixSkeleton);
    expect(document.head.querySelector('style[data-chronix-ui="skeleton"]')).not.toBeNull();
  });
});
