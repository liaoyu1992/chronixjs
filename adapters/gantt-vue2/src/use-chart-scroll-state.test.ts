import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

import { useChartScrollState } from './use-chart-scroll-state.js';

import type { VueConstructor } from 'vue';

/**
 * Mount a host component exposing a single scrollable pane wired
 * to `useChartScrollState`. Tests can find the pane + drive
 * scroll events / mutate clientWidth-like geometry to verify the
 * returned refs update reactively.
 *
 * Mirrors chronix-vue3's `use-chart-scroll-state.test.ts:13-34` host
 * helper. Vue 2.7's `defineComponent` + `mount` runtime matches Vue 3's
 * exactly here; the `VueConstructor` cast bridges `@vue/test-utils@1.x`'s
 * Vue 2 type signature.
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
          // Vue 2.7's vnode-data `ref` field accepts a callback that fires
          // on mount with the resolved element + on unmount with null —
          // the only way to wire a Composition-API `ref` to a DOM node
          // in a render function (string refs go to `this.$refs`, not
          // to the local `ref()`). The `as never` cast bridges Vue 2's
          // vnode-data type for `ref` and our narrower HTMLElement
          // signature without leaking a wider type-error surface.
          ref: ((el: HTMLElement | null) => {
            paneRef.value = el;
          }) as never,
          attrs: { 'data-test': 'pane' },
          style: { overflow: 'auto', width: '300px', height: '100px' },
        });
    },
  });
  const HostForTest = Host as unknown as VueConstructor;
  const wrapper = mount(HostForTest);
  return { wrapper, captured };
}

describe('useChartScrollState', () => {
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
    // happy-dom-default values are. Both refs should be numbers.
    expect(typeof captured.scrollLeft!.value).toBe('number');
    expect(typeof captured.clientWidth!.value).toBe('number');
  });

  it('updates scrollLeft when the pane fires a scroll event', () => {
    const { wrapper, captured } = mountHost();
    const pane = wrapper.find('[data-test="pane"]').element as HTMLElement;
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
    const pane = wrapper.find('[data-test="pane"]').element as HTMLElement;
    // Simulate a resize by mutating the element's clientWidth proxy + invoking the observer.
    Object.defineProperty(pane, 'clientWidth', { value: 480, configurable: true });
    holder.cb?.([], {} as ResizeObserver);
    expect(captured.clientWidth!.value).toBe(480);
  });

  it('returns reactive refs — consumers can read updates across multiple scroll events', () => {
    const { wrapper, captured } = mountHost();
    const pane = wrapper.find('[data-test="pane"]').element as HTMLElement;
    const seen: number[] = [];
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
    const pane = wrapper.find('[data-test="pane"]').element as HTMLElement;
    const removeSpy = vi.spyOn(pane, 'removeEventListener');
    wrapper.destroy();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(disconnected).toBe(true);
  });
});
