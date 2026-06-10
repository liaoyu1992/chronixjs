import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixSkeleton } from './chronix-skeleton.js';

const Skeleton = ChronixSkeleton as unknown as VueConstructor;

describe('ChronixSkeleton (vue2) — default rendering', () => {
  it('renders a <div> with base + text + animated', () => {
    const wrapper = mount(Skeleton);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-skeleton');
    expect(wrapper.classes()).toContain('cx-ui-skeleton--text');
    expect(wrapper.classes()).toContain('cx-ui-skeleton--animated');
  });

  it('emits no inline width/height when undefined', () => {
    const wrapper = mount(Skeleton);
    const style = wrapper.attributes('style') ?? '';
    expect(style).not.toMatch(/width:/);
    expect(style).not.toMatch(/height:/);
  });
});

describe('ChronixSkeleton (vue2) — shape prop', () => {
  it.each(['text', 'rect', 'circle'] as const)('shape="%s" adds the matching modifier', (s) => {
    const wrapper = mount(Skeleton, { propsData: { shape: s } });
    expect(wrapper.classes()).toContain(`cx-ui-skeleton--${s}`);
  });
});

describe('ChronixSkeleton (vue2) — width/height props', () => {
  it('numeric width becomes Npx', () => {
    const wrapper = mount(Skeleton, { propsData: { width: 200 } });
    expect(wrapper.attributes('style')).toMatch(/width:\s*200px/);
  });

  it('numeric height becomes Npx', () => {
    const wrapper = mount(Skeleton, { propsData: { height: 60 } });
    expect(wrapper.attributes('style')).toMatch(/height:\s*60px/);
  });

  it('string width passes through verbatim', () => {
    const wrapper = mount(Skeleton, { propsData: { width: '50%' } });
    expect(wrapper.attributes('style')).toMatch(/width:\s*50%/);
  });

  it('both width + height render together', () => {
    const wrapper = mount(Skeleton, { propsData: { width: 100, height: 40 } });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toMatch(/width:\s*100px/);
    expect(style).toMatch(/height:\s*40px/);
  });
});

describe('ChronixSkeleton (vue2) — animated + round modifiers', () => {
  it('omits --animated when animated=false', () => {
    const wrapper = mount(Skeleton, { propsData: { animated: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-skeleton--animated');
  });

  it('adds --round when round=true', () => {
    const wrapper = mount(Skeleton, { propsData: { round: true } });
    expect(wrapper.classes()).toContain('cx-ui-skeleton--round');
  });
});

describe('ChronixSkeleton (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-skeleton stylesheet is in document.head', () => {
    mount(Skeleton);
    expect(document.head.querySelector('style[data-chronix-ui="skeleton"]')).not.toBeNull();
  });
});
