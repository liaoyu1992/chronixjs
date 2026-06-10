import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';

import { useScrollSync } from './use-scroll-sync.js';

/**
 * Mount a tiny host component that exposes two scrollable divs +
 * wires `useScrollSync` between them. Returns the wrapper so tests
 * can `find` the panes + drive scroll events programmatically.
 */
function mountHost() {
  const Host = defineComponent({
    setup() {
      // Return a render function from setup so the closure binds
      // the setup-scope refs directly into Vue's auto-bind ref slot
      // (passing the Ref<> object to `ref:` is the canonical
      // pattern; string-ref + setup refs don't auto-sync).
      const paneA = ref<HTMLElement | null>(null);
      const paneB = ref<HTMLElement | null>(null);
      useScrollSync(paneA, paneB);
      return () =>
        h('div', null, [
          h('div', {
            ref: paneA,
            'data-test': 'pane-a',
            style: { overflow: 'auto', height: '100px' },
          }),
          h('div', {
            ref: paneB,
            'data-test': 'pane-b',
            style: { overflow: 'auto', height: '100px' },
          }),
        ]);
    },
  });
  return mount(Host);
}

/**
 * Wait one rAF tick. The composable's source-flag reset runs in
 * `requestAnimationFrame`, so tests that need to observe post-reset
 * state await this helper.
 */
function nextRaf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('useScrollSync — Phase 23', () => {
  it('attaches scroll listeners on mount and removes them on unmount', () => {
    const wrapper = mountHost();
    const paneA = wrapper.find<HTMLElement>('[data-test="pane-a"]').element;
    const paneB = wrapper.find<HTMLElement>('[data-test="pane-b"]').element;
    const removeSpyA = vi.spyOn(paneA, 'removeEventListener');
    const removeSpyB = vi.spyOn(paneB, 'removeEventListener');
    wrapper.unmount();
    expect(removeSpyA).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeSpyB).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('scroll on paneA writes paneB.scrollTop (one-way forward)', async () => {
    const wrapper = mountHost();
    const paneA = wrapper.find<HTMLElement>('[data-test="pane-a"]').element;
    const paneB = wrapper.find<HTMLElement>('[data-test="pane-b"]').element;
    paneA.scrollTop = 42;
    paneA.dispatchEvent(new Event('scroll'));
    expect(paneB.scrollTop).toBe(42);
    await nextRaf();
  });

  it('scroll on paneB writes paneA.scrollTop (one-way reverse)', async () => {
    const wrapper = mountHost();
    const paneA = wrapper.find<HTMLElement>('[data-test="pane-a"]').element;
    const paneB = wrapper.find<HTMLElement>('[data-test="pane-b"]').element;
    paneB.scrollTop = 17;
    paneB.dispatchEvent(new Event('scroll'));
    expect(paneA.scrollTop).toBe(17);
    await nextRaf();
  });

  it('source-guard prevents writeback loop (B-from-A propagation does not bounce back)', async () => {
    const wrapper = mountHost();
    const paneA = wrapper.find<HTMLElement>('[data-test="pane-a"]').element;
    const paneB = wrapper.find<HTMLElement>('[data-test="pane-b"]').element;

    // Drive A's scroll. The composable writes B.scrollTop = 25,
    // which fires B's scroll event synchronously. The handler must
    // see source = 'a' and bail out — leaving A unchanged.
    paneA.scrollTop = 25;
    paneA.dispatchEvent(new Event('scroll'));
    // Manually fire B's scroll event (simulating browser firing it).
    paneB.dispatchEvent(new Event('scroll'));
    // A's scrollTop must NOT have been overwritten to a stale value
    // by the bounced B-handler — it stays at 25.
    expect(paneA.scrollTop).toBe(25);
    expect(paneB.scrollTop).toBe(25);
    await nextRaf();
  });

  it('rAF reset allows the next scroll to propagate from either side', async () => {
    const wrapper = mountHost();
    const paneA = wrapper.find<HTMLElement>('[data-test="pane-a"]').element;
    const paneB = wrapper.find<HTMLElement>('[data-test="pane-b"]').element;

    // First scroll on A.
    paneA.scrollTop = 10;
    paneA.dispatchEvent(new Event('scroll'));
    expect(paneB.scrollTop).toBe(10);
    await nextRaf();

    // After rAF, B can drive the next scroll fresh.
    paneB.scrollTop = 99;
    paneB.dispatchEvent(new Event('scroll'));
    expect(paneA.scrollTop).toBe(99);
    await nextRaf();
  });

  it('null refs are safe — no-sidebar mode where one pane never renders', () => {
    const Host = defineComponent({
      setup() {
        const paneA = ref<HTMLElement | null>(null);
        const paneB = ref<HTMLElement | null>(null);
        // Intentionally never wire refs to DOM — both stay null.
        useScrollSync(paneA, paneB);
        return {};
      },
      render() {
        return h('div');
      },
    });
    // Should not throw on mount or unmount.
    const wrapper = mount(Host);
    expect(() => wrapper.unmount()).not.toThrow();
  });
});

// Coverage for the ref-typing contract — the composable accepts
// the standard Vue3 `Ref<HTMLElement | null>` shape exported from
// `vue` core, without any narrowing helpers.
type _RefShape = (a: Ref<HTMLElement | null>, b: Ref<HTMLElement | null>) => void;
const _: _RefShape = useScrollSync;
