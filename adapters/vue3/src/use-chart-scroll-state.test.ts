import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { useChartScrollState } from './use-chart-scroll-state.js';

/**
 * Mount a host component exposing a single scrollable pane wired
 * to `useChartScrollState`. Tests can find the pane + drive
 * scroll events / mutate clientWidth-like geometry to verify the
 * returned refs update reactively.
 */
function mountHost() {
  const captured: {
    scrollLeft?: ReturnType<typeof useChartScrollState>['scrollLeft'];
    clientWidth?: ReturnType<typeof useChartScrollState>['clientWidth'];
  } = {};
  const Host = defineComponent({
    setup() {
      const paneRef = ref<HTMLElement | null>(null);
      const state = useChartScrollState(paneRef);
      captured.scrollLeft = state.scrollLeft;
      captured.clientWidth = state.clientWidth;
      return () =>
        h('div', {
          ref: paneRef,
          'data-test': 'pane',
          style: { overflow: 'auto', width: '300px', height: '100px' },
        });
    },
  });
  const wrapper = mount(Host);
  return { wrapper, captured };
}

describe('useChartScrollState — Phase 23', () => {
  let originalResizeObserver: typeof globalThis.ResizeObserver | undefined;

  beforeEach(() => {
    originalResizeObserver = globalThis.ResizeObserver;
  });

  afterEach(() => {
    if (originalResizeObserver !== undefined) {
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });

  it('initializes scrollLeft and clientWidth refs', () => {
    const { captured } = mountHost();
    // After mount, readState() runs once — captures whatever the
    // jsdom-default values are. Both refs should be numbers.
    expect(typeof captured.scrollLeft!.value).toBe('number');
    expect(typeof captured.clientWidth!.value).toBe('number');
  });

  it('updates scrollLeft when the pane fires a scroll event', () => {
    const { wrapper, captured } = mountHost();
    const pane = wrapper.find<HTMLElement>('[data-test="pane"]').element;
    pane.scrollLeft = 75;
    pane.dispatchEvent(new Event('scroll'));
    expect(captured.scrollLeft!.value).toBe(75);
  });

  it('updates clientWidth when ResizeObserver fires', () => {
    // Stub ResizeObserver so the test can invoke the callback synchronously.
    // Holder object keeps the cb reference assignable from inside the
    // constructor without TS narrowing the outer `let` to `null`.
    const holder: { cb: ResizeObserverCallback | undefined } = { cb: undefined };
    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        holder.cb = cb;
      }
      observe(): void {
        // mock-only; no-op
      }
      unobserve(): void {
        // mock-only; no-op
      }
      disconnect(): void {
        // mock-only; no-op
      }
    }
    globalThis.ResizeObserver = MockResizeObserver;

    const { wrapper, captured } = mountHost();
    const pane = wrapper.find<HTMLElement>('[data-test="pane"]').element;
    // Simulate a resize by mutating the element's clientWidth proxy + invoking the observer.
    Object.defineProperty(pane, 'clientWidth', { value: 480, configurable: true });
    holder.cb?.([], {} as ResizeObserver);
    expect(captured.clientWidth!.value).toBe(480);
  });

  it('returns reactive refs — consumers can `watch` and react to changes', () => {
    const { wrapper, captured } = mountHost();
    const pane = wrapper.find<HTMLElement>('[data-test="pane"]').element;
    const seen: number[] = [];
    // Watch the scrollLeft ref by reading it across multiple updates.
    seen.push(captured.scrollLeft!.value);
    pane.scrollLeft = 10;
    pane.dispatchEvent(new Event('scroll'));
    seen.push(captured.scrollLeft!.value);
    pane.scrollLeft = 20;
    pane.dispatchEvent(new Event('scroll'));
    seen.push(captured.scrollLeft!.value);
    expect(seen).toEqual([0, 10, 20]);
  });

  it('cleans up scroll listener + ResizeObserver on unmount', () => {
    let disconnected = false;
    class MockResizeObserver {
      constructor(_cb: ResizeObserverCallback) {
        // mock-only; cb stored is unused — this test asserts disconnect()
      }
      observe(): void {
        // mock-only; no-op
      }
      unobserve(): void {
        // mock-only; no-op
      }
      disconnect(): void {
        disconnected = true;
      }
    }
    globalThis.ResizeObserver = MockResizeObserver;

    const { wrapper } = mountHost();
    const pane = wrapper.find<HTMLElement>('[data-test="pane"]').element;
    const removeSpy = vi.spyOn(pane, 'removeEventListener');
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(disconnected).toBe(true);
  });
});
