import {
  PARITY_RESOURCE_IDS_VUE2,
  buildParityEventsVue2,
  buildParityLinksVue2,
  type ParityEventVue2,
  type ParityLinkVue2,
} from '@chronixjs/golden-runner/parity-events-vue2';

import type { BarSpec, LinkSpec, RowSpec } from '@chronixjs/gantt';

/**
 * Sample data for the chronix-vue2 demo's **parity mode** (URL query
 * `?parity=true`). Mirrors the original spec Vue 2 demo's
 * `RESOURCES[]` + `generateEvents()` so the two demos render the same
 * id-paired bars on the same id-paired rows. Imports from
 * `@chronixjs/golden-runner/parity-events-vue2` — the single source
 * of truth for the parity-vue2 dataset (also consumed by
 * `tests/parity-vue2.spec.ts`).
 *
 * What this DOES NOT replicate:
 *
 * - The original spec Vue 2 demo's resource RENDER order. It
 *   renders resource `d` as a parent group with `d1` + `d2` children
 *   nested underneath; chronix v0 emits all 11 ids as peer rows in
 *   `PARITY_RESOURCE_IDS_VUE2` order (a / b / c / d / d1 / d2 / e / f
 *   / g / h / i). Cross-demo Y parity is parked until a
 *   resource-hierarchy row sorter lands — same disposition as vue3
 *   (see `sample-data-parity.ts:22-28` for the vue3 precedent).
 * - Event styling (`backgroundColor` / `extendedProps.priority` /
 *   `extendedProps.status`). Parity v0 compares observable geometry
 *   only; style cascade parity is a Phase 31.6.1+ extension.
 * - Progress-bar overlay rendering. The `progressValue` IS mirrored
 *   on the 4 events that carry one (#6/7/8/9 from the parity
 *   reference's `event-generator.js`); render-level progress parity
 *   defers to Phase 31.6.1+.
 *
 * What this DOES replicate:
 *
 * - 11 resource ids matching the original `RESOURCES[]` (a +
 *   b + c + d + d1 + d2 + e + f + g + h + i).
 * - 9 events with original spec ids 1..9 plus identical
 *   (resourceId, startMs, endMs) tuples so X + width parity can hold.
 */
export const sampleRowsParityVue2: readonly RowSpec[] = PARITY_RESOURCE_IDS_VUE2.map((id) => ({
  id,
  columns: { name: id },
}));

function parityEventToBar(event: ParityEventVue2): BarSpec {
  const bar: BarSpec = {
    id: event.id,
    rowId: event.resourceId,
    range: {
      start: new Date(event.startMs),
      end: new Date(event.endMs),
    },
    title: event.title,
    dprIntent: 'crisp-pixel',
    // Per-event bar background (Phase 28.3.1 mirror for vue2): populates
    // only for events touched by `PARITY_LINKS_VUE2` so chronix-vue2
    // source-bar fill matches reference-vue2's resolved color via Layer 3
    // (BarSpec.style.backgroundColor wins over Layer 2 prop default).
    // Required for cross-demo `useLineEventColor` link-stroke parity.
    ...(event.backgroundColor !== undefined
      ? { style: { backgroundColor: event.backgroundColor } }
      : {}),
  };
  if (event.progressValue !== undefined) {
    return { ...bar, progress: { value: event.progressValue } };
  }
  return bar;
}

/**
 * Returns a fresh array each call so consumers can keep a mutable copy.
 * Used as `ref<BarSpec[]>(initialSampleBarsParityVue2())` in DemoApp.vue
 * so drag/resize/progress commits update the chart reactively even in
 * parity mode (matches the regular `initialSampleBars` shape).
 *
 * Builds the events relative to today's local-midnight epoch so the
 * chronix-vue2 demo's parity-mode render matches what the parity
 * reference's `generateEvents()` produces from `new Date()` at module
 * load. When
 * the Playwright test installs a frozen clock at `FROZEN_TIME_ISO`
 * BEFORE navigation, both demos observe the same `Date.now()` ⇒ same
 * `todayMs` ⇒ identical bar geometry.
 */
export function initialSampleBarsParityVue2(): BarSpec[] {
  const todayMs = Date.now();
  return buildParityEventsVue2(todayMs).map(parityEventToBar);
}

/**
 * Phase 37: ParityLinkVue2 → LinkSpec mapping for chronix-vue2's link
 * render path. Identical shape to vue3's `parityLinkToSpec`
 * (`sample-data-parity.ts:83-91`); routing='square' + marker='arrow'.
 */
function parityLinkToSpec(link: ParityLinkVue2): LinkSpec {
  return {
    id: link.id,
    fromBarId: link.fromBarId,
    toBarId: link.toBarId,
    routing: 'square',
    marker: 'arrow',
  };
}

/**
 * Phase 37: parity-mode link set for chronix-vue2. Mirrors the 8-edge
 * `PARITY_LINKS` curated subset declared in
 * `@chronixjs/golden-runner/parity-events` (original spec vue3
 * event ids), translated to the 6 edges whose endpoints exist in
 * vue2's 9-event subset (original spec vue2 event ids). Threaded
 * through the chronix demo's parity mode so
 * cross-demo `useLineEventColor` assertions see equivalent dependency
 * graphs on both sides — see `audit/PHASE_37_PARITY_VUE2_HEAVIER_DESIGN.md`
 * for the asymmetry rationale.
 */
export const sampleLinksParityVue2: readonly LinkSpec[] =
  buildParityLinksVue2().map(parityLinkToSpec);
