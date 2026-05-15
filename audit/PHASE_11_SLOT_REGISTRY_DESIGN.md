# Phase 11 — Custom bar renderers via `SlotRegistry`

**Status**: Approved (2026-05-15). Implementation in progress.

## Problem

`<ChronixGantt>` always renders each placed bar as a bare `<rect
class="cx-gantt-bar">`. Consumers can recolor bars via CSS
(`.cx-gantt-bar { fill: ...; stroke: ... }`) and recolor chrome
via Phase 10's theme, but cannot **change the shape** of a bar:
no rounded corners, no inline icons, no per-bar status badges, no
chevron decorations, no multi-element compositions.

The Phase 1 type design already laid the foundation for this —
`SlotContext`, `SlotTemplate`, `SlotRegistry`, `SlotRenderer` have
been sitting in `packages/gantt/src/render/slot.ts` since
2026-05-13 with zero call-sites. Phase 11 activates them by
wiring a `'bar'` slot through `<ChronixGantt>`: a consumer
registers a renderer, the adapter calls it per placed bar, and
the default `<rect>` becomes a fallback for the un-registered
case.

This is the single most-requested customization vector in
practice — k-ui's `eventContent` slot is the canonical example
(`DemoApp.vue:2208-2211` demos a `<template v-slot:eventContent>`
that renders `<b>` + `<i>` for time / title text).

## Reference (k-ui) behavior surface — full catalog

Walked `packages/gantt/src/options.ts` (eventContent typing),
`packages/gantt/src/event-rendering/EventRenderingContext.ts`,
and `examples/gantt/vue3/src/DemoApp.vue:1439-1746, 2207-2212`.
Each item marked ✅ done / ⏸️ parked / ❌ rejected.

### Slot mechanics

1. ✅ **One slot type for v0: `'bar'`.** Replaces the entire bar
   render — the consumer's renderer is responsible for emitting
   whatever VNode tree they want (rect, group, icon, etc.). The
   adapter falls back to the default `<rect>` when no renderer is
   registered.
2. ⏸️ **Additional slot types** (`'progress-overlay'`,
   `'tick-label'`, `'header-cell'`, `'sidebar-cell'`) — parked.
   The IR `SlotRegistry` interface supports any string slot name;
   adding more is additive (a future phase can register them in
   the adapter's render fn without breaking v0).
3. ✅ **Registry-based dispatch** (`registry.get('bar')`) rather
   than per-slot props. Aligns with the dormant IR types.
   Alternative considered: a `barRenderer?: (ctx) => VNode` prop.
   Rejected because it doesn't activate the IR + creates a
   one-prop-per-slot explosion as slot types grow.
4. ✅ **Callback-based templates** matching the IR
   `SlotTemplate = (ctx: SlotContext) => unknown`. Return type
   `unknown` because core doesn't know which framework's VNode
   shape applies; the adapter narrows to `VNode | VNode[]` at the
   boundary.
5. ⏸️ **Vue3 `<template v-slot:bar>` support** — parked.
   Callback-based is simpler for v0; a Vue3 slot wrapper can
   sit on top later. The current adapter is a `defineComponent`
   with a render fn (no `.vue` SFC), so Vue slots aren't a
   first-class feature today anyway.
6. ⏸️ **React-style children render-props** — parked alongside
   Vue slots; only matters when the React adapter lands.
7. ❌ **Pre/post-render hooks** (mutate rendered DOM after Vue
   reconciliation, like k-ui's `eventDidMount`) — rejected. Vue3
   has `onMounted` + `ref` for the same purpose; chronix doesn't
   add a parallel mechanism.

### Slot context shape

8. ✅ **`BarSlotArgs` interface exported.** Documents what the
   `'bar'` slot's `ctx.args` contains:
   - `placedBar: PlacedBar` (geometry from `BarPlacementPass`)
   - `sourceBar: BarSpec` (the IR source — title, range, progress,
     etc.)
   - `renderX / renderY / renderWidth / renderHeight: number`
     (post-transaction live geometry — same numbers the default
     `<rect>` would use)
   - `theme: ChronixTheme` (the merged effective theme — so
     custom renderers can color-match the chrome)
   - `activeTransaction: AnyTransaction | null` (so renderers
     can react to live drag / resize / progress states)
9. ⏸️ **Selection / hover state** — parked; chronix has no
   selection model yet (catalog item 17 of Phase 9 rejected it).
10. ⏸️ **View-id / axis info** in args — parked; can be added
    additively if a consumer needs view-aware bar rendering.
11. ❌ **Mutable callbacks** (renderer mutates the args object) —
    rejected. Args are readonly per IR contract.

### Registry lifecycle

12. ✅ **`createSlotRegistry()` factory exported.** Returns an
    object adhering to the `SlotRegistry` interface
    (`get / has / register / unregister`). Consumers don't have
    to implement the interface themselves.
13. ✅ **Registry is consumer-owned.** Consumer creates the
    registry, registers templates, passes it as a prop. The
    adapter doesn't manage lifetime — it just reads from
    whatever the prop holds.
14. ✅ **`slotRegistry?: SlotRegistry` prop** on `<ChronixGantt>`.
    Optional — when undefined, every render path falls through
    to defaults. When set, the registry is consulted per slot.
15. ⏸️ **Reactive `register / unregister` mid-mount** — parked.
    The adapter reads the registry per render; if a consumer
    registers a new template mid-render, the next reactive pass
    picks it up automatically. No explicit invalidation API.
16. ⏸️ **Per-slot fallback chain** (e.g. `registry.get('bar-tall')`
    falls through to `'bar'` if undefined) — parked; YAGNI for v0.

### Default rendering preservation

17. ✅ **Default `<rect>` emitted when no 'bar' slot registered.**
    Zero impact on existing consumers — adding `slotRegistry` is
    purely additive. VRT baselines unchanged in this configuration.
18. ✅ **Custom renderer fully replaces the default.** No "merge"
    or "extend default" semantics — if a consumer registers a
    `'bar'` slot, they own the entire bar render (geometry,
    fill, stroke, classes, etc.). The `theme` arg lets them
    delegate to chronix's color tokens if they want.
19. ⏸️ **Per-bar opt-in/opt-out** (e.g. `BarSpec.slot?: string`
    naming a specific slot per bar) — parked. v0: the `'bar'`
    slot applies to every placed bar uniformly. A future phase
    can add per-bar slot selection when consumers need it.

### Theme coordination

20. ✅ **`theme` passed through to slot ctx.** Custom renderers
    can read `theme.progressFill` etc. so the consumer chrome
    matches Phase 10's tokens without copy-pasting hex codes.
21. ⏸️ **Per-slot theme tokens** (e.g. `theme.barCustomBackground`
    that the default `'bar'` slot ignores but custom ones honor)
    — parked. Consumers can add their own tokens to a wrapper
    interface; chronix's `ChronixTheme` stays focused on the
    chrome it actually renders.

### Demo wiring

22. ⏸️ **Demo registration of a custom 'bar' slot** — parked for
    v0. Reasons: keeping VRT baselines untouched (default rect is
    pixel-identical to today); the SFC tests already prove the
    indirection at the unit level; a demo showcase is a natural
    Phase 11.x scope when chronix gains a documentation site.
23. ❌ **Required-prop slot** (consumer MUST register a renderer)
    — rejected. Zero-config default-rect rendering is the
    correct out-of-the-box experience.

## Approach

### New core helper: `createSlotRegistry`

`packages/gantt/src/render/create-slot-registry.ts`:

```ts
import type { SlotRegistry, SlotTemplate } from './slot.js';

/**
 * Build a fresh `SlotRegistry`. Templates register / unregister via
 * the returned methods; the registry holds a private `Map<string,
 * SlotTemplate>`. Consumers typically create one registry at app
 * setup time, register all their templates, and pass it as
 * `<ChronixGantt :slot-registry="registry">`.
 */
export function createSlotRegistry(): SlotRegistry {
  const map = new Map<string, SlotTemplate>();
  return {
    get(slot) {
      return map.get(slot);
    },
    has(slot) {
      return map.has(slot);
    },
    register(slot, template) {
      map.set(slot, template);
    },
    unregister(slot) {
      map.delete(slot);
    },
  };
}
```

Exported from `@chronixjs/gantt`'s top-level index alongside other
factories (`defaultLinkRouter`, `defaultStripResolver`,
`defaultChronixTheme`).

### Slot args interface for `'bar'`

`packages/gantt/src/render/bar-slot.ts`:

```ts
import type { ChronixTheme } from '../api/chronix-theme.js';
import type { BarSpec } from '../ir/index.js';
import type { AnyTransaction } from '../interaction/index.js';
import type { PlacedBar } from '../layout/types.js';

/**
 * Args bag passed as `SlotContext.args` when the 'bar' slot fires.
 * Each placed bar gets one invocation per render pass; the renderer
 * returns the framework's VNode shape for that bar (`VNode | VNode[]`
 * in Vue3; `ReactNode` in React). The default `<rect>` is replaced
 * entirely — there's no "merge with default" mode.
 *
 * Geometry fields (`renderX/Y/Width/Height`) reflect live transaction
 * state: e.g. mid-drag they include the deltaX/deltaY shift and the
 * cross-row snap-to-target-strip math. Same numbers the default
 * `<rect>` would use, so a custom renderer can drop them straight
 * into a `<rect>` of its own.
 */
export interface BarSlotArgs {
  readonly placedBar: PlacedBar;
  readonly sourceBar: BarSpec;
  readonly renderX: number;
  readonly renderY: number;
  readonly renderWidth: number;
  readonly renderHeight: number;
  readonly theme: ChronixTheme;
  readonly activeTransaction: AnyTransaction | null;
}

/** The slot name chronix's adapter uses for per-bar rendering. */
export const BAR_SLOT_NAME = 'bar';
```

### Adapter integration

`<ChronixGantt>` gains:

```ts
slotRegistry: {
  type: Object as PropType<SlotRegistry | undefined>,
  default: undefined,
},
```

In the render fn's `placedBars.flatMap`, replace the unconditional
default `<rect>` with:

```ts
const registry = props.slotRegistry;
const barTemplate = registry?.get(BAR_SLOT_NAME);
if (barTemplate) {
  const slotArgs: BarSlotArgs = {
    placedBar: bar,
    sourceBar: sourceBar!,
    renderX, renderY, renderWidth, renderHeight: bar.height,
    theme: t,
    activeTransaction: activeTxn,
  };
  const custom = barTemplate({ slot: BAR_SLOT_NAME, args: slotArgs });
  nodes.push(...(Array.isArray(custom) ? custom : [custom]));
} else {
  // default <rect class="cx-gantt-bar"> — same as today
  nodes.push(h('rect', { ... }));
}
```

Progress overlay + handle still render below the bar (unchanged
order). They sit on top of whatever the custom renderer emits.

`sourceBar!` is safe because `placedBars` is derived from
`props.bars` — every PlacedBar has a corresponding BarSpec. The
non-null assertion mirrors the existing pattern at the progress-
overlay site.

### Demo

No demo wiring in v0. `slotRegistry` prop is omitted on the demo's
`<ChronixGantt>` → default rect render → VRT baselines unchanged.
A future Phase 11.x can add a showcase that registers a custom
renderer (e.g. status chevron based on `progress > 50`).

## Test coverage

### Core tests — `create-slot-registry.test.ts` (+5)

1. `createSlotRegistry()` returns an empty registry — `has('x')` false.
2. `register('bar', fn)` then `get('bar')` returns the same function.
3. `has('bar')` true after register, false after unregister.
4. `register('bar', fn1)` then `register('bar', fn2)` replaces (no
   merge); `get('bar')` returns `fn2`.
5. `unregister('nonexistent')` is a no-op (doesn't throw).

### Adapter tests — `chronix-gantt.test.ts` (+5)

6. **Default behavior unchanged**: no `slotRegistry` prop → bars
   render as `<rect class="cx-gantt-bar">` (smoke that the existing
   render path still fires).
7. **Custom 'bar' template fires once per placed bar**: registry
   with a `'bar'` template that returns a `<g data-test="custom"/>`;
   N bars → N `[data-test="custom"]` elements; zero
   `<rect class="cx-gantt-bar">` (default replaced).
8. **Slot args expose placed-bar geometry**: template receives ctx
   with `args.placedBar.barId` matching `data-bar-id`, and
   `args.renderX === bar.x` etc.
9. **Slot args expose theme**: template can read
   `args.theme.progressFill === defaultChronixTheme.progressFill`.
10. **Unregister mid-life**: register then unregister; next render
    falls back to default rect.

**Total new tests: 10.** core 192 → 197; vue3 136 → 141. Chronix
total 328 → 338.

## VRT impact

None. The demo doesn't register a `'bar'` slot, so every render
path falls through to the default `<rect>`. The 5 chronix VRT
baselines re-verify clean post-Commit 2.

## Execution plan — 2 commits + wrap-up

### Commit 1: core slot infrastructure + 5 unit tests

- New file `packages/gantt/src/render/create-slot-registry.ts`
  exporting `createSlotRegistry()`.
- New file `packages/gantt/src/render/bar-slot.ts` exporting
  `BarSlotArgs` interface + `BAR_SLOT_NAME` constant.
- Update `packages/gantt/src/render/index.ts` + `packages/gantt/src/index.ts`
  re-exports.
- New test file `packages/gantt/src/render/create-slot-registry.test.ts`
  with 5 cases.
- ci-check green → commit.

### Commit 2: adapter consumes `slotRegistry` + 5 SFC tests

- `<ChronixGantt>` props: add `slotRegistry?: SlotRegistry`
  (optional, default undefined).
- Render fn: pull `registry?.get(BAR_SLOT_NAME)` into a local
  ref per render; if defined, call with a `BarSlotArgs` ctx and
  push the returned VNode(s) into the bar's `nodes` array; else
  emit the default `<rect>` as today.
- Progress overlay + handle paths unchanged — they still emit
  below the bar regardless of registry.
- 5 SFC tests in `chronix-gantt.test.ts` covering default
  fallback, custom template invocation, args propagation, theme
  exposure, mid-life unregister.
- Browser-verify: chronix demo at 8702 still renders identically
  (no slot registered).
- ci-check green → commit.

### Commit 3: wrap-up

- `audit/journal/2026-05-13.md` adds Phase 11 section.
- This doc's Status → DONE with commit shas.
- Memory `project_gantt_rewrite_plan.md`: test count 328 → 338,
  Phase 11 added.

## Estimated scope

- Design doc: ~1 hour (this commit, separate)
- Commit 1 (core registry + 5 tests): ~1 hour
- Commit 2 (adapter wire + 5 SFC tests): ~2 hours
- Commit 3 (docs): ~30 min
- **Total: ~4.5 hours focused work.**

## Open questions for the user

1. **Approve registry-based dispatch over per-slot props?**
   Recommended — activates the dormant IR types, scales to
   multiple slot types additively. Catalog item 3 parks the
   per-prop alternative.

2. **Approve callback-based templates** (no Vue3
   `<template v-slot:bar>` wrapper)? Recommended for v0 —
   chronix's adapter is a `defineComponent` with render fn,
   not an SFC, so Vue slots aren't first-class today.

3. **Approve "custom renderer fully replaces default rect"
   semantics?** Alternative: custom renderer receives the default
   VNode as `args.defaultVNode` and decides whether to wrap or
   replace. Rejected — adds API surface without a clear use
   case; the slot ctx's geometry + theme args make "wrap"
   trivial (custom renderer emits the default rect itself, then
   adds extra nodes).

4. **Approve `BarSlotArgs` shape** (placedBar + sourceBar +
   renderX/Y/W/H + theme + activeTransaction)? Alternatives:
   - Pass only `placedBar` + `sourceBar`; let the renderer
     compute renderX/Y from the transaction. Rejected — the
     adapter already does this math; replicating it is fragile.
   - Pass an opaque `BarRenderContext` class instance. Rejected
     — readonly plain-data interface is simpler and matches IR
     conventions.

5. **Approve no demo wiring in v0?** Recommended — keeps VRT
   baselines untouched. A future Phase 11.x can add a showcase.

6. **Confirm one slot type ('bar') for v0?** Additional slots
   (progress-overlay, tick-label, header-cell, sidebar-cell)
   parked at catalog item 2 — additive when needed.

7. **Confirm `slotRegistry: undefined` (the default) is
   zero-impact?** Yes — every render path checks `registry?.get`
   before falling through to defaults. No measurable cost when
   no registry is passed.

Reply **"按照推荐继续"** to accept all defaults (registry-based,
callback-only, full-replace semantics, BarSlotArgs as designed,
no demo wiring, one slot type, undefined-default zero-impact).
