import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';

import { useScrollSync } from './use-scroll-sync.js';

import type Vue from 'vue';

/**
 * Mount a tiny host component that exposes two scrollable divs +
 * wires `useScrollSync` between them. Returns the wrapper so tests
 * can `find` the panes + drive scroll events programmatically.
 * Verbatim port of `adapters/gantt-vue3/src/use-scroll-sync.test.ts`
 * adapted to Vue 2.7's render-fn + @vue/test-utils v1 mount.
 */
function mountHost() {
  const Host = defineComponent({
    setup() {
      const paneA = ref<HTMLElement | null>(null);
      const paneB = ref<HTMLElement | null>(null);
      useScrollSync(paneA, paneB);
      return () =>
        h('div', {}, [
          h('div', {
            ref: ((el: HTMLElement | null) => {
              paneA.value = el;
            }) as never,
            attrs: { 'data-test': 'pane-a' },
            style: { overflow: 'auto', height: '100px' },
          }),
          h('div', {
            ref: ((el: HTMLElement | null) => {
              paneB.value = el;
            }) as never,
            attrs: { 'data-test': 'pane-b' },
            style: { overflow: 'auto', height: '100px' },
          }),
        ]);
    },
  });
  return mount(Host as unknown as typeof Vue);
}

function nextRaf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('useScrollSync (Phase 49 — vue2 port of Phase 23)', () => {
  it('attaches scroll listeners on mount and removes them on unmount', () => {
    const wrapper = mountHost();
    const paneA = wrapper.find<HTMLElement>('[data-test="pane-a"]').element;
    const paneB = wrapper.find<HTMLElement>('[data-test="pane-b"]').element;
    const removeSpyA = vi.spyOn(paneA, 'removeEventListener');
    const removeSpyB = vi.spyOn(paneB, 'removeEventListener');
    wrapper.destroy();
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

    paneA.scrollTop = 25;
    paneA.dispatchEvent(new Event('scroll'));
    paneB.dispatchEvent(new Event('scroll'));
    expect(paneA.scrollTop).toBe(25);
    expect(paneB.scrollTop).toBe(25);
    await nextRaf();
  });

  it('rAF reset allows the next scroll to propagate from either side', async () => {
    const wrapper = mountHost();
    const paneA = wrapper.find<HTMLElement>('[data-test="pane-a"]').element;
    const paneB = wrapper.find<HTMLElement>('[data-test="pane-b"]').element;

    paneA.scrollTop = 10;
    paneA.dispatchEvent(new Event('scroll'));
    expect(paneB.scrollTop).toBe(10);
    await nextRaf();

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
        return () => h('div');
      },
    });
    const wrapper = mount(Host as unknown as typeof Vue);
    expect(() => wrapper.destroy()).not.toThrow();
  });
});

// Coverage for the ref-typing contract — the composable accepts the
// standard Vue 2.7 `Ref<HTMLElement | null>` shape exported from
// `vue` core (Composition API backport).
type _RefShape = (a: Ref<HTMLElement | null>, b: Ref<HTMLElement | null>) => void;
const _: _RefShape = useScrollSync;
void _;
