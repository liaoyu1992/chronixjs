import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixCountdown } from './chronix-countdown.js';

// Vue 2's @vue/test-utils v1 does NOT export flushPromises (added
// in the Vue 3 rewrite of test-utils). Local helper resolves the
// next microtask tick which is enough for our setInterval-driven
// reactive updates in this test (no nested promises).
async function flushPromises(): Promise<void> {
  await Vue.nextTick();
}

const Countdown = ChronixCountdown as unknown as VueConstructor;

describe('ChronixCountdown (vue2)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a <div> with base + tabular-nums', () => {
    const wrapper = mount(Countdown);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-countdown');
    expect(wrapper.classes()).toContain('cx-ui-countdown--tabular-nums');
  });

  it('renders __value with the duration formatted at precision=0', () => {
    const wrapper = mount(Countdown, { propsData: { duration: 65_000 } });
    expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:01:05');
  });

  it('ticks down as time advances', async () => {
    const wrapper = mount(Countdown, { propsData: { duration: 5_000 } });
    expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:05');
    vi.advanceTimersByTime(3_000);
    await flushPromises();
    expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:02');
  });

  it('emits "finish" when reaching 0', async () => {
    const wrapper = mount(Countdown, { propsData: { duration: 1_000 } });
    vi.advanceTimersByTime(1_000);
    await flushPromises();
    expect(wrapper.emitted('finish')).toBeTruthy();
  });

  it('does NOT tick when active=false', async () => {
    const wrapper = mount(Countdown, {
      propsData: { duration: 10_000, active: false },
    });
    expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:10');
    vi.advanceTimersByTime(5_000);
    await flushPromises();
    expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:10');
  });

  it('adds --paused modifier when active=false', () => {
    const wrapper = mount(Countdown, { propsData: { active: false } });
    expect(wrapper.classes()).toContain('cx-ui-countdown--paused');
  });

  it('renders __label and prefix/suffix slots', () => {
    const wrapper = mount(Countdown, {
      propsData: { label: 'Sale ends in', duration: 1_000 },
      slots: { prefix: '⏳', suffix: 'left' },
    });
    expect(wrapper.find('.cx-ui-countdown__label').text()).toBe('Sale ends in');
    expect(wrapper.find('.cx-ui-countdown__prefix').text()).toBe('⏳');
    expect(wrapper.find('.cx-ui-countdown__suffix').text()).toBe('left');
  });

  it('mounting ensures the chronix-countdown stylesheet is in document.head', () => {
    mount(Countdown);
    expect(document.head.querySelector('style[data-chronix-ui="countdown"]')).not.toBeNull();
  });
});
