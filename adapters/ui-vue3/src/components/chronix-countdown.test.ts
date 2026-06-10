import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixCountdown } from './chronix-countdown.js';

describe('ChronixCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('default rendering', () => {
    it('renders a <div> with base + tabular-nums', () => {
      const wrapper = mount(ChronixCountdown);
      expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
      expect(wrapper.classes()).toContain('cx-ui-countdown');
      expect(wrapper.classes()).toContain('cx-ui-countdown--tabular-nums');
    });

    it('renders __value at 00:00:00 with no duration', () => {
      const wrapper = mount(ChronixCountdown);
      expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:00');
    });

    it('omits __label by default (undefined)', () => {
      const wrapper = mount(ChronixCountdown);
      expect(wrapper.find('.cx-ui-countdown__label').exists()).toBe(false);
    });

    it('renders __value with the duration formatted at precision=0 by default', () => {
      const wrapper = mount(ChronixCountdown, { props: { duration: 65_000 } });
      expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:01:05');
    });
  });

  describe('ticking', () => {
    it('ticks down the displayed value as time advances (precision=0)', async () => {
      const wrapper = mount(ChronixCountdown, { props: { duration: 5_000 } });
      expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:05');

      vi.advanceTimersByTime(2_000);
      await flushPromises();
      expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:03');

      vi.advanceTimersByTime(3_000);
      await flushPromises();
      expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:00');
    });

    it('emits "finish" when the countdown reaches 0', async () => {
      const wrapper = mount(ChronixCountdown, { props: { duration: 1_000 } });
      vi.advanceTimersByTime(1_000);
      await flushPromises();
      expect(wrapper.emitted('finish')).toBeTruthy();
      expect(wrapper.emitted('finish')!.length).toBe(1);
    });

    it('does NOT emit "finish" twice when overrun (interval cleared after fire)', async () => {
      const wrapper = mount(ChronixCountdown, { props: { duration: 1_000 } });
      vi.advanceTimersByTime(5_000);
      await flushPromises();
      expect(wrapper.emitted('finish')!.length).toBe(1);
    });
  });

  describe('active prop', () => {
    it('does NOT tick when active=false', async () => {
      const wrapper = mount(ChronixCountdown, {
        props: { duration: 10_000, active: false },
      });
      expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:10');
      vi.advanceTimersByTime(5_000);
      await flushPromises();
      expect(wrapper.find('.cx-ui-countdown__value').text()).toBe('00:00:10');
    });

    it('adds --paused modifier when active=false', () => {
      const wrapper = mount(ChronixCountdown, { props: { active: false } });
      expect(wrapper.classes()).toContain('cx-ui-countdown--paused');
    });
  });

  describe('label + prefix/suffix slots', () => {
    it('renders __label + --with-label when label supplied', () => {
      const wrapper = mount(ChronixCountdown, {
        props: { label: 'Sale ends in' },
      });
      expect(wrapper.classes()).toContain('cx-ui-countdown--with-label');
      expect(wrapper.find('.cx-ui-countdown__label').text()).toBe('Sale ends in');
    });

    it('renders __prefix + __suffix from slots', () => {
      const wrapper = mount(ChronixCountdown, {
        props: { duration: 1_000 },
        slots: { prefix: '⏳', suffix: 'left' },
      });
      expect(wrapper.find('.cx-ui-countdown__prefix').text()).toBe('⏳');
      expect(wrapper.find('.cx-ui-countdown__suffix').text()).toBe('left');
      expect(wrapper.classes()).toContain('cx-ui-countdown--with-prefix');
      expect(wrapper.classes()).toContain('cx-ui-countdown--with-suffix');
    });
  });

  describe('CSS injection', () => {
    it('mounting ensures the chronix-countdown stylesheet is in document.head', () => {
      mount(ChronixCountdown);
      expect(document.head.querySelector('style[data-chronix-ui="countdown"]')).not.toBeNull();
    });
  });
});
