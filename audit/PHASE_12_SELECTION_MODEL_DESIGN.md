# Phase 12 — Selection model (`bar-click` + controlled selection)

**Status**: Approved (2026-05-15). Implementation in progress.

## Problem

Chronix has no way to surface "the user clicked bar X". The
`<ChronixGantt>` adapter emits `bar-drop` / `bar-resize` /
`bar-progress` / `select` / `link-orphan` — every interaction
EXCEPT the simplest one. Consumers wanting to wire a context
menu, a side panel, keyboard navigation, or "delete selected"
have no entry point. The Phase 9 catalog noted "no selection
model in chronix" as a parked item; Phase 12 closes it.

A full selection model is the precondition for most interactive
features that aren't drag-related. Without it:

- Click-to-open-detail panels can't exist
- Keyboard arrow-key navigation can't exist
- Multi-bar operations ("duplicate selected", "delete selected")
  can't exist
- The Phase 11 `'bar'` slot has no `isSelected` flag for custom
  renderers to visually distinguish selected vs unselected

Phase 12 ships the foundation: a `'bar-click'` emit + controlled
`selectedBarIds` prop + `'selection-change'` emit + an `isSelected`
flag in `BarSlotArgs` + a default `.cx-gantt-bar--selected` CSS
class hook + a `useGanttSelection()` composable helper for
ergonomic uncontrolled consumption.

## Reference (k-ui) behavior surface — full catalog

Walked `packages/gantt/src/interactions/EventClicking.ts:1-71`,
`packages/gantt/src/interaction/interactions/UnselectAuto.ts:1-72`,
`packages/gantt/src/options.ts` (eventClick typing,
unselectAuto, unselectCancel, selectMirror), and the demo's
`handleEventClick` at `DemoApp.vue:1681-1685`. Each item is
marked ✅ done / ⏸️ parked / ❌ rejected for Phase 12.

### Click detection

1. ✅ **Pointerup-driven click emit.** Distinct from a separate
   `click` event listener — chronix already owns the pointerdown/
   move/up lifecycle for drag transactions, and routing the click
   through the same handler ensures the drag-vs-click discrimination
   is one-source-of-truth.
2. ✅ **Drag-vs-click discrimination.** A pointerup that committed
   any transaction (bar-drag, bar-resize, progress-handle,
   calendar-range-select) MUST NOT also fire `'bar-click'`. K-ui
   uses data-attribute flags (`data-just-dragged`); chronix uses
   a render-time `wasDragCommit` flag set at commit time and
   read at click-emit time.
3. ✅ **Click only fires on the bar body**, not edges (resize
   zones) or the progress handle. The hit-tester already
   distinguishes these; click-emit only fires when
   `hit.kind === 'bar-body'`.
4. ⏸️ **Touch long-press for selection.** k-ui has
   `selectLongPressDelay` for touch devices. Parked; chronix
   doesn't yet differentiate touch vs mouse pointer types in the
   composable.
5. ⏸️ **Double-click event** (`bar-dblclick`). Parked; common
   request but not in the demo. Can be added additively.
6. ⏸️ **Right-click / context-menu event** (`bar-contextmenu`).
   Parked. Same additive pattern.

### Selection state

7. ✅ **Controlled selection** via `selectedBarIds?: readonly
string[]` prop. Consumer owns the array; adapter never mutates
   it. Changes flow via `'selection-change'` emit. Matches Vue3's
   `v-model:selectedBarIds` convention.
8. ✅ **Single-click replaces selection** (selects only the
   clicked bar, deselecting all others). Standard list-UI
   convention.
9. ✅ **Shift-click multi-select (toggle).** Holding Shift on a
   click toggles the clicked bar's selection: not-selected →
   add to selection; already-selected → remove. K-ui uses
   `ctrlKey || metaKey` for toggle; chronix uses `shiftKey` for
   broader OS compatibility (Cmd vs Ctrl on macOS vs Windows).
10. ⏸️ **Range select (shift-click between two bars selects
    everything between)** — parked. Common in list UIs but
    chronix bars aren't naturally "ordered" along a single axis
    (multi-row + multi-time). Defer until a consumer asks.
11. ⏸️ **Ctrl/Cmd-click toggle** (separate from shift's
    add-range semantics in list-UIs) — parked. v0 uses shift
    for toggle; Ctrl behavior can join when range-select lands.
12. ✅ **Click on empty area clears selection** when
    `unselectAuto: true` (default). Matches k-ui's `unselectAuto`.
13. ⏸️ **`unselectCancel: string` selector** for "don't unselect
    when click lands in this DOM region" — parked. K-ui uses
    this so context menus / form fields don't accidentally
    clear selection. Chronix consumers can prevent the unselect
    by calling `event.stopPropagation()` on their own DOM
    handlers. Add later if a consumer pattern emerges.

### Visual feedback

14. ✅ **`BarSlotArgs.isSelected: boolean` field** added so
    Phase 11 custom slot renderers can react to selection state.
15. ✅ **Default `<rect>` gets `.cx-gantt-bar--selected` class
    when selected.** Consumers can write
    `.cx-gantt-bar--selected { stroke: var(--accent); stroke-
width: 2 }` in their CSS for OOTB visual feedback. The slot
    renderer path is the primary hook; the CSS class is the
    zero-config fallback for adopters who only use the default
    rect.
16. ⏸️ **Theme tokens for selected state** (e.g.
    `theme.barSelectedStroke`, `theme.barSelectedStrokeWidth`)
    — parked. CSS-class approach handles 90% of cases; theme
    tokens can join if a consumer needs runtime-configurable
    selection visuals without CSS.
17. ⏸️ **Mirror element for selection feedback during drag**
    (k-ui's `selectMirror`) — parked. Phase 9's free-Y +
    snap-to-strip render already covers drag preview; no
    additional selection-aware variant needed.

### Composable convenience

18. ✅ **`useGanttSelection(): UseGanttSelectionOutput` helper.**
    Returns `{ selectedBarIds, select, deselect, toggle, clear,
isSelected, handleBarClick }`. Wraps the controlled-mode
    pattern with a `Set`-backed ref + a ready-to-bind
    `@bar-click="handleBarClick"` callback for the common
    no-multi-select case. Opt-in: consumers who want full
    control bypass it and manage `selectedBarIds` themselves.
19. ⏸️ **Keyboard navigation** (arrow keys move selection
    across bars) — parked. Requires bar-ordering semantics
    (next-bar-in-row, next-row-down) that depend on consumer
    intent. Selection state is the precondition; navigation
    layer is a separate phase.
20. ⏸️ **`v-model:selectedBarIds` two-way binding** in Vue3 —
    chronix's adapter is a `defineComponent` with explicit
    props + emits; consumer can wire `v-model` manually via
    `:selected-bar-ids` + `@selection-change`. Parked because
    Vue's `v-model` macro requires a specific prop/emit naming
    pair that's already satisfied by the current shape.

### Event payload shape

21. ✅ **`BarClickPayload = { barId: string; sourceBar: BarSpec;
jsEvent: PointerEvent }`**. Matches the existing `BarDrop /
BarResize / BarProgress / Select` payload shapes (each fires
    with `barId` + relevant context + the originating event when
    applicable). Chronix uses `PointerEvent` (not `MouseEvent`)
    since the entire pointer lifecycle runs through Pointer
    Events.
22. ✅ **`SelectionChangePayload = { selectedBarIds: readonly
string[]; addedBarIds: readonly string[]; removedBarIds:
readonly string[] }`.** Three arrays so consumers can react
    to the delta without diffing. Matches the
    `BarDrop.{oldRange,newRange}` precedent.
23. ⏸️ **`shiftKey` / `ctrlKey` flags on the payload** — parked.
    The composable already differentiates internally based on
    `jsEvent.shiftKey`; consumers can read `jsEvent.shiftKey`
    directly if they need it.

### Drag-vs-click discrimination

24. ✅ **`wasDragCommit` flag on the pointer state.** Set when
    `commit()` fires for any non-click transaction. Read at the
    end of the pointerup handler — if true, suppress
    `'bar-click'`. Reset to false at the next `pointerdown`.
25. ⏸️ **Drag-distance threshold** (treat pointermoves < N px as
    a click even when a transaction started) — parked. K-ui's
    `EventDragging` has a minimum-drag-distance check; chronix's
    `PointerCaptureSession` doesn't, so this would require
    transaction-layer changes. v0 keeps it strict: any commit
    suppresses click.

## Approach

### Component API after Phase 12

`<ChronixGantt>` gains:

```ts
// New props
selectedBarIds?: readonly string[];   // default []
unselectAuto?: boolean;               // default true

// New emits
'bar-click': (payload: BarClickPayload) => true;
'selection-change': (payload: SelectionChangePayload) => true;
```

`BarSlotArgs` (from Phase 11) gains:

```ts
readonly isSelected: boolean;
```

### Default-rect visual

The default `<rect>` render path becomes:

```ts
h('rect', {
  key: bar.barId,
  'data-bar-id': bar.barId,
  class: selected ? 'cx-gantt-bar cx-gantt-bar--selected' : 'cx-gantt-bar',
  ...
});
```

Consumers who only use the default rect can opt-in to visual
selection via CSS:

```css
.cx-gantt-bar--selected {
  stroke: #2563eb;
  stroke-width: 2;
}
```

The Phase 11 slot renderer path receives `isSelected` in args
and decides its own visual.

### Composable: `useGanttSelection()`

`adapters/vue3/src/use-gantt-selection.ts`:

```ts
import { computed, ref, type ComputedRef } from 'vue';

import type { BarClickPayload, SelectionChangePayload } from './use-gantt-pointer.js';

export interface UseGanttSelectionOutput {
  readonly selectedBarIds: ComputedRef<readonly string[]>;
  isSelected(barId: string): boolean;
  select(barId: string): void;
  deselect(barId: string): void;
  toggle(barId: string): void;
  clear(): void;
  /** Drop-in handler for `<ChronixGantt @bar-click="handleBarClick">`. */
  handleBarClick(payload: BarClickPayload): void;
  /** Drop-in handler for `<ChronixGantt @selection-change="handleSelectionChange">`. */
  handleSelectionChange(payload: SelectionChangePayload): void;
}

export function useGanttSelection(): UseGanttSelectionOutput { ... }
```

Internally backed by a `Set<string>` ref so add/remove are O(1).
`selectedBarIds` is a `ComputedRef<readonly string[]>` derived from
the Set (sorted insertion-order via `Array.from`).

### Adapter drag-vs-click discrimination

In `useGanttPointer`'s pointer lifecycle:

```ts
// Pointer state (new)
const wasDragCommit = ref(false);

function begin(...) {
  wasDragCommit.value = false; // reset on each new pointerdown
  // ... existing transaction-start logic
}

function commit() {
  // ... existing per-kind commit logic
  // Set the flag for the next pointerup-driven click decision
  wasDragCommit.value = true;
}
```

In `<ChronixGantt>`'s `onPointerup`:

```ts
function onPointerup(e: PointerEvent): void {
  const hadTxn = pointer.activeTransaction.value !== null;
  if (hadTxn) {
    pointer.commit(); // sets wasDragCommit = true via commit()
  }
  // Click emit: only fire if no transaction committed AND
  // pointerdown landed on a bar-body hit (not empty-row, not
  // edge, not progress-handle).
  if (!pointer.wasDragCommit.value && pointer.lastHit.value?.kind === 'bar-body') {
    const sourceBar = props.bars.find((b) => b.id === pointer.lastHit.value.barId);
    if (sourceBar) {
      emit('bar-click', {
        barId: pointer.lastHit.value.barId,
        sourceBar,
        jsEvent: e,
      });
    }
  }
  bodySvgRef.value?.releasePointerCapture?.(e.pointerId);
}
```

Click-outside (clears selection when `unselectAuto`): when
pointerdown lands with no hit OR with an empty-row hit AND no
shift, and `props.unselectAuto !== false`, emit
`'selection-change'` with an empty `selectedBarIds`.

Actually cleaner: keep the click-outside detection ENTIRELY in
the consumer's `useGanttSelection()` composable, which reads
both `'bar-click'` (with potential shift-key) and the
`'select'` event (which already fires on empty-row drag). For
plain empty-row CLICK (no drag), we need a new emit — or treat
absence-of-bar-click as the cue. The composable subscribes to
both events and orchestrates.

Refined: pull `unselectAuto` logic into the composable, NOT the
adapter. Adapter just emits `'bar-click'` on bar hits + a new
`'empty-area-click'` on empty hits (analogous to the existing
`'select'` for empty-area DRAGS). Composable subscribes to both
and applies its own clear-on-empty-click policy.

This keeps the adapter dumb and the composable smart. Adapter
ships TWO new emits: `'bar-click'` and `'empty-area-click'`. The
`unselectAuto` prop moves to the composable's config.

### Sample composable consumer

```vue
<script setup>
import { ChronixGantt, useGanttSelection } from '@chronixjs/gantt-vue3';

const selection = useGanttSelection({ unselectAuto: true });
</script>

<template>
  <ChronixGantt
    :bars="bars"
    :selected-bar-ids="selection.selectedBarIds.value"
    @bar-click="selection.handleBarClick"
    @empty-area-click="selection.handleEmptyAreaClick"
  />
</template>
```

## Test coverage

### Core/Adapter composable tests — `use-gantt-selection.test.ts` (+8)

1. Empty selection by default: `selectedBarIds.value === []`,
   `isSelected('b1') === false`.
2. `select('b1')` adds: `selectedBarIds.value === ['b1']`,
   `isSelected('b1') === true`.
3. `select('b1')` then `select('b2')` (no clear) appends:
   `selectedBarIds.value === ['b1', 'b2']`.
4. `deselect('b1')` removes one: `selectedBarIds.value === ['b2']`.
5. `toggle('b1')` adds when absent, removes when present.
6. `clear()` empties.
7. `handleBarClick({ barId: 'b1', jsEvent: { shiftKey: false } })`
   REPLACES selection (becomes `['b1']`).
8. `handleBarClick({ barId: 'b1', jsEvent: { shiftKey: true } })`
   TOGGLES (`isSelected('b1') ? deselect : select`).
9. `handleEmptyAreaClick(...)` with `unselectAuto:true` clears;
   with `unselectAuto:false` no-ops.

(9 actually — adjusted to round out the API surface.)

### Adapter SFC tests — `chronix-gantt.test.ts` (+6)

10. **'bar-click' fires on plain click on bar body** with payload
    `{ barId, sourceBar, jsEvent }`. No drag → no transaction →
    click fires.
11. **'bar-click' does NOT fire after a drag commit.** Begin on
    bar body, move, up → 'bar-drop' fires, 'bar-click' does not.
12. **'bar-click' does NOT fire on bar edge / progress handle**
    (hit.kind ≠ 'bar-body').
13. **`selectedBarIds` prop → `.cx-gantt-bar--selected` class
    on default rect** for each selected id.
14. **`isSelected` propagates to BarSlotArgs** (Phase 11
    integration): registry's slot template receives
    `ctx.args.isSelected` matching the prop.
15. **'empty-area-click' fires on plain click on empty row**
    (no drag, hit.kind === 'empty-row'). Triggers when `selectable`
    is false too — click events shouldn't depend on selectable.

### Drag-vs-click corner cases (in same SFC file)

16. **Pointerdown → pointerup with no movement on bar body =
    click.** Zero pixel delta → no transaction starts (drag
    threshold is implicitly any-delta) → bar-click fires.

(16 — caps at 8 composable + 6+1 SFC = 15.)

**Total new tests: 15.** core 199 (unchanged — composable lives
in adapter); vue3 141 → 156. Chronix total 340 → 355.

## VRT impact

None expected. Demo doesn't auto-select any bars; default
`selectedBarIds: []` → no `.cx-gantt-bar--selected` class → no
visual change. The 5 chronix VRT baselines re-verify clean
post-Commit 2.

## Execution plan — 2 commits + wrap-up

### Commit 1: adapter `useGanttSelection` composable + types + 9 tests

- New file `adapters/vue3/src/use-gantt-selection.ts` exporting
  `UseGanttSelectionOutput` interface + `useGanttSelection()` +
  payload types `BarClickPayload` + `SelectionChangePayload` +
  `EmptyAreaClickPayload`.
- Re-export from `adapters/vue3/src/index.ts`.
- New test file `adapters/vue3/src/use-gantt-selection.test.ts`
  with 9 unit tests covering all composable methods + event
  handlers.
- No adapter changes yet — composable is pure logic.
- ci-check green → commit.

### Commit 2: adapter wires click/selection + 6 SFC tests + Phase 11 BarSlotArgs extension

- `BarSlotArgs` (in `packages/gantt/src/render/bar-slot.ts`) gains
  `readonly isSelected: boolean` field.
- `<ChronixGantt>` props: add `selectedBarIds?: readonly string[]`
  (default `[]`).
- `<ChronixGantt>` emits: add `'bar-click'`, `'empty-area-click'`.
- `useGanttPointer` (in
  `adapters/vue3/src/use-gantt-pointer.ts`) gains a
  `wasDragCommit: Ref<boolean>` flag — set by `commit()`, reset
  by `begin()`, read by the adapter's click decision.
- `<ChronixGantt>` `onPointerup`: after the optional commit,
  check `!wasDragCommit && lastHit.kind === 'bar-body'` →
  emit `'bar-click'`. If `lastHit.kind === 'empty-row'` and no
  transaction committed → emit `'empty-area-click'`.
- Render fn: build `selectedSet = new Set(props.selectedBarIds)`;
  default `<rect>` gets `.cx-gantt-bar--selected` class when
  `selectedSet.has(bar.barId)`. Slot ctx's `isSelected = selectedSet.has(bar.barId)`.
- 6 SFC tests in `chronix-gantt.test.ts` covering the 6 cases
  from the test plan above (and the 16th implicit "zero-delta is
  click" baseline). Adjust to 7 if zero-delta needs its own test.
- Browser-verify: chronix demo at 8702 — click a bar (logs
  bar-click event in the events panel), shift-click for multi,
  click empty area to clear. (Demo wiring follows — see Commit
  2b note below.)
- ci-check green → commit.

### Commit 2b (folded into Commit 2): demo wiring

- `App.vue` imports `useGanttSelection`, instantiates it, binds
  `:selected-bar-ids` + `@bar-click` + `@empty-area-click`.
- Demo's event panel shows `bar-click: bar-1 [single]` /
  `bar-click: bar-2 [+shift]` lines for end-to-end browser
  verify.
- Adds a `.cx-gantt-bar--selected` rule to `styles.css` showing
  a 2-px accent stroke so VRT-untouched but interactive verify
  works.

### Commit 3: wrap-up

- `audit/journal/2026-05-13.md` adds Phase 12 section.
- This doc's Status → DONE with commit shas.
- Memory `project_gantt_rewrite_plan.md` updated: test count
  340 → 355, Phase 12 added.

## Estimated scope

- Design doc: ~1 hour (this commit, separate)
- Commit 1 (composable + 9 tests): ~2 hours
- Commit 2 (adapter wire-up + 6 SFC tests + demo wiring): ~2.5 hours
- Commit 3 (wrap-up docs): ~30 min
- Browser verify: ~15 min
- **Total: ~6 hours focused work.**

## Open questions for the user

1. **Approve controlled `selectedBarIds` prop over a built-in
   stateful adapter?** Recommended — chronix's other interactive
   props (editable, selectable, links) are consumer-controlled.
   Adding internal state would create two sources of truth.

2. **Approve `useGanttSelection()` composable as the opt-in
   stateful convenience?** Recommended — the controlled prop
   is the primary path; the composable wraps it for the common
   90% case (single + multi-select with auto-clear-on-empty).

3. **Approve shift-click as the multi-select gesture?**
   Alternative: ctrl/cmd-click (matches OS file-manager
   conventions; differs from list-UIs which use shift for
   range). Recommended: shift, simpler cross-OS, and the
   range-select scope is parked anyway.

4. **Approve emitting both `'bar-click'` and `'empty-area-click'`
   as separate channels?** Alternative: single `'gantt-click'`
   with discriminated payload. Recommended: two emits — Vue3
   `@bar-click` reads more naturally than `@gantt-click` with
   a `target` discriminator.

5. **Approve drag-vs-click via `wasDragCommit` flag** rather than
   distance threshold? Recommended — k-ui's distance threshold
   adds another layer of pointer state; chronix's transaction
   layer already knows "did something commit". Strict
   "any-commit-suppresses-click" rule is simpler.

6. **Approve adding `BarSlotArgs.isSelected` to Phase 11's
   interface?** This is technically a breaking change to Phase
   11 — consumer slot templates that already destructured args
   would still work (extra field is additive), but the
   interface gained a field. Recommended: yes, it's purely
   additive (no field removed or retyped).

7. **Approve `.cx-gantt-bar--selected` class on the default
   rect as the zero-config visual?** Consumers can override in
   CSS or via custom slot. Alternative: no default visual,
   require consumers to use the slot. Recommended: ship the
   class hook so OOTB consumers get a working visual with one
   line of CSS.

8. **Confirm no demo-side VRT baseline change** since the demo
   doesn't auto-select on load? VRT captures the initial state
   where `selectedBarIds === []` → no class change → no pixel
   diff. The 5 baselines re-verify clean.

Reply **"按照推荐继续"** to accept all defaults (controlled
prop + opt-in composable, shift-click multi-select, two emit
channels, wasDragCommit discrimination, BarSlotArgs additive
extension, default-rect class hook, no VRT change).
