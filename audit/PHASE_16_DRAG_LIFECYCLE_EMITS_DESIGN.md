# Phase 16 — Drag / resize lifecycle emits (`bar-dragstart` / `bar-dragstop` / `bar-resizestart` / `bar-resizestop`)

**Status**: **Approved (pending user reply)** — design only; no code yet.

> Phase 15 numbering is intentionally skipped — the original Phase 13
> note proposed Phase 15 as "`bar-dblclick` + `bar-contextmenu`", but
> the user's parity discipline ("k-ui 里没有的，chronix 也可以没有")
> moves those to ⏸️ parked status alongside Phase 13's catalog. The
> next ROI is the real-parity gap in the drag/resize lifecycle —
> labeling it 16 leaves room to revisit 15 with a different scope.

## Problem

Chronix's adapter exposes commit-time emits (`bar-drop` / `bar-resize` /
`bar-progress` / `select`) but no begin / end emits for drag and resize.
A consumer who wants to know "when did the user START dragging this
bar" (e.g. to disable a side panel, show a status indicator, or kick
off a request to validate availability windows) has no entry point.
The reference's lifecycle has explicit `eventDragStart` /
`eventDragStop` / `eventResizeStart` / `eventResizeStop` emits —
chronix should match that surface.

This is **strict parity work**: 4 new emits, all begin/end pairs, no
continuous "move" emit (because the reference doesn't have one). The
addition is purely additive to chronix's API; no existing emit is
renamed or removed.

## Reference (k-ui) behavior surface — full catalog

Walked `packages/gantt/src/interaction/interactions/EventDragging.ts:140-159, 440-456`
and `packages/gantt/src/interaction/interactions/EventResizing.ts:115-132, 224-249`.
Both files have the same shape — interaction layer fires emitter
events at well-defined lifecycle points.

### Drag lifecycle (`EventDragging.ts`)

1. **`eventDragStart`** fires ONCE at `handleDragStart` when
   `this.isDragging` is `true` — the reference has a "drag confirmed"
   gate (pointer moved past a small threshold) that ensures pure
   clicks do NOT fire dragstart. Payload: `{ el, event, jsEvent, view }`.
2. **`eventDragStop`** fires ONCE at `handleDragEnd` (line 450) BEFORE
   any drop / mutation logic. Always fires when drag is confirmed,
   regardless of whether the mutation is valid. Payload: same shape.
3. **NO continuous "drag move" emit.** `handleDragMove` at line 161
   explicitly comments "We don't reset mirror during drag move to
   allow smooth visual feedback" — the only state mutation during
   drag is internal (mirror element position). The emitter is silent.
4. **`drop`** (line 555) fires only on cross-context drag-and-drop
   (external draggable dropped into the timeline). Not in scope for
   chronix v0 — chronix doesn't model external drag sources.
5. **`eventDrop`** (NOT shown in the audit slice — separate code path)
   fires AFTER `eventDragStop` when mutation is valid. Already
   present in chronix as `'bar-drop'`.

### Resize lifecycle (`EventResizing.ts`)

6. **`eventResizeStart`** fires ONCE at `handleDragStart` (line 126)
   when the resize interaction confirms. Same payload shape as drag.
7. **`eventResizeStop`** fires ONCE at `handleDragEnd` (line 244)
   before any commit logic. Payload: same shape.
8. **NO continuous "resize move" emit.** `handleHitUpdate` at line
   134 updates internal preview state but doesn't emit.
9. **`eventResize`** (line 275) fires AFTER `eventResizeStop` when
   mutation is valid. Already present in chronix as `'bar-resize'`.

### Catalog with chronix v0 dispositions

| Item                                                            | k-ui | Chronix v0                                                                                                                                                                           |
| --------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `eventDragStart` lifecycle emit                                 | ✅   | ✅ port                                                                                                                                                                              |
| `eventDragStop` lifecycle emit                                  | ✅   | ✅ port                                                                                                                                                                              |
| `eventResizeStart` lifecycle emit                               | ✅   | ✅ port                                                                                                                                                                              |
| `eventResizeStop` lifecycle emit                                | ✅   | ✅ port                                                                                                                                                                              |
| Start fires only after drag CONFIRMED (not on plain click)      | ✅   | ✅ port                                                                                                                                                                              |
| Stop fires regardless of mutation validity                      | ✅   | ✅ port                                                                                                                                                                              |
| Stop fires BEFORE the commit emit (`eventDrop` / `eventResize`) | ✅   | ✅ port                                                                                                                                                                              |
| Continuous "drag move" emit during pointer travel               | ❌   | ⏸️ parked                                                                                                                                                                            |
| Continuous "resize move" emit during pointer travel             | ❌   | ⏸️ parked                                                                                                                                                                            |
| Cross-context drop (`drop`)                                     | ✅   | ⏸️ parked — chronix doesn't model external drag sources                                                                                                                              |
| `progress-handle` start/stop emits (parallel pair)              | ❌   | ⏸️ parked — `progress-handle` in chronix is a separate transaction kind; the reference's progress UI lives inside EventDragging                                                      |
| `calendar-range-select` start/stop emits (parallel pair)        | ❌   | ⏸️ parked — `select` already fires on commit; `selectAllow` is a different concept (predicate, not emit)                                                                             |
| `eventDragStart.el` (subject DOM element)                       | ✅   | ⏸️ parked — chronix payloads don't carry DOM references (cross-framework portability); consumers use `barId` + own DOM queries                                                       |
| `eventDragStart.view` (view API handle)                         | ✅   | ⏸️ parked — chronix doesn't expose a `view` API object yet                                                                                                                           |
| `eventDragStart.jsEvent` (originating PointerEvent)             | ✅   | ✅ port — same precedent as `BarClickPayload.jsEvent`                                                                                                                                |
| `didCommit: boolean` flag on stop payload                       | ❌   | ⏸️ parked — consumer infers from "did `bar-drop` fire after `bar-dragstop`"; an explicit flag would be a chronix-extra and we'd rather mirror the reference's "two channels" pattern |

### When exactly does start fire? — the "confirmed drag" gate

The reference uses a pointer-distance threshold to decide when a
gesture transitions from "potential click" to "confirmed drag". Pure
clicks (pointerdown → pointerup with no movement) never set
`isDragging = true`, so they never fire `eventDragStart` /
`eventDragStop`.

Chronix's pointer composable doesn't have a distance threshold —
`begin()` immediately starts a transaction on any qualifying hit
(`bar-body` for drag, `bar-edge-*` for resize). The 0-delta
discrimination lives in the adapter's `onPointerup` handler:

```ts
const isNoOpDrag =
  (txn.kind === 'bar-drag' && txn.deltaX === 0 && txn.deltaY === 0) ||
  (txn.kind === 'bar-resize' && txn.deltaX === 0) ||
  ...;
if (isNoOpDrag) pointer.abort();
else pointer.commit();
```

If chronix fired `bar-dragstart` eagerly at `begin()` time, a plain
click on a bar (which triggers a 0-delta `bar-drag` that gets
aborted) would fire spurious `dragstart` / `dragstop` events — a
behavior break from the reference where pure clicks fire NEITHER.

**Solution: lazy-fire on first non-zero `advance()`.** The composable
tracks a `dragStartFired: boolean` flag (reset on each `begin()`); on
each `advance()`, after updating the transaction, if its delta is now
non-zero AND the flag is false, fire the corresponding start callback
and set the flag. On `commit()` / `abort()`, if the flag is true, fire
the corresponding stop callback.

| Click trace                                | Start fires? | Stop fires?     | Reference behavior                           |
| ------------------------------------------ | ------------ | --------------- | -------------------------------------------- |
| pointerdown → pointerup (0-delta)          | NO           | NO              | Matches ref                                  |
| pointerdown → pointermove(0,0) → up        | NO           | NO              | Matches ref                                  |
| pointerdown → pointermove(10,0) → up       | YES (once)   | YES (once)      | Matches ref                                  |
| pointerdown → move(10,0) → move(20,0) → up | YES (once)   | YES (once)      | Matches ref                                  |
| pointerdown → move(10,0) → pointercancel   | YES          | YES (via abort) | Matches ref ("regardless of valid mutation") |

## Approach

### Composable extension — new callback inputs

```ts
// adapters/vue3/src/use-gantt-pointer.ts (additions)

export interface BarDragStartPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
}

export interface BarDragStopPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
}

export interface BarResizeStartPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly edge: 'start' | 'end';
}

export interface BarResizeStopPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly edge: 'start' | 'end';
}

export interface UseGanttPointerInput {
  // ... existing fields
  readonly onBarDragStart?: (payload: BarDragStartPayload) => void;
  readonly onBarDragStop?: (payload: BarDragStopPayload) => void;
  readonly onBarResizeStart?: (payload: BarResizeStartPayload) => void;
  readonly onBarResizeStop?: (payload: BarResizeStopPayload) => void;
}
```

The composable's input already takes `barRanges` (map of barId →
TimeRange) but not the full `BarSpec`. To populate `sourceBar` we
need either:

- **Option A**: Add `bars: MaybeRefOrGetter<readonly BarSpec[]>` as a
  composable input (the adapter already has it from props). Composable
  looks up by id when firing start/stop.
- **Option B**: Composable just emits `barId`; the adapter wraps the
  callback and adds `sourceBar` from its props before passing to
  `emit('bar-dragstart', ...)`.

Recommended: **B**. Keeps the composable narrow (it doesn't need to
hold a reference to the full bar array). The adapter is the natural
place to attach `sourceBar` since it already has `props.bars` and
already does similar enrichment for `bar-click` (`find(b => b.id ===
hit.barId)` at the emit site).

So the composable's payloads carry just `barId` (+ `edge` for
resize); the adapter constructs the public payload at the emit site.

```ts
// Composable internal callback payload (narrower):
export interface BarDragStartCallback {
  readonly barId: string;
}
// Adapter's public emit payload (richer):
export interface BarDragStartPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly jsEvent: PointerEvent;
}
```

Hmm but `jsEvent` is also adapter-owned (the composable is event-
agnostic; it works in content-space coords). Need to think about how
to thread `jsEvent` through. The composable's `advance()` is called
from the adapter's `onPointermove`, so:

```ts
// In the adapter's onPointermove (where we already have `e: PointerEvent`):
function onPointermove(e: PointerEvent) {
  // ... existing pos resolution
  pointer.advance(pos.x, pos.y);
  // After advance, check if start just fired. But the composable's
  // callbacks don't have direct visibility of jsEvent...
}
```

The cleanest path: composable's callback receives the `barId` (and
edge for resize); the adapter's callback handler closes over the most
recent `jsEvent` ref that's set by `onPointermove`/`onPointerdown`.
We don't actually need to pipe jsEvent through the composable — the
adapter's closure captures it from the in-scope handler.

Actually simpler — just bind the callback creation inline in the
adapter's `useGanttPointer({ ... })` call, and the callback closes
over `e` only if the adapter chooses to set a `currentJsEvent` ref.
But this gets fiddly.

**Final decision**: composable's start/stop callbacks receive
`{ barId }` (drag) or `{ barId, edge }` (resize) only — no jsEvent. The
adapter sets a `lastJsEvent: Ref<PointerEvent | null>` updated on
every `onPointerdown` / `onPointermove`. When the composable's
callback fires, the adapter's callback handler enriches the payload
with `sourceBar` (from `props.bars`) and `jsEvent` (from
`lastJsEvent.value`) before calling `emit(...)`.

```ts
// In setup():
const lastJsEvent = ref<PointerEvent | null>(null);

const pointer = useGanttPointer({
  // ... existing inputs
  onBarDragStart: ({ barId }) => {
    const sourceBar = props.bars.find((b) => b.id === barId);
    if (!sourceBar || !lastJsEvent.value) return;
    emit('bar-dragstart', { barId, sourceBar, jsEvent: lastJsEvent.value });
  },
  // ... similar for stop / resize-start / resize-stop
});

function onPointerdown(e: PointerEvent): void {
  if (e.button !== 0) return;
  lastJsEvent.value = e; // capture for downstream callbacks
  // ... existing logic
}

function onPointermove(e: PointerEvent): void {
  lastJsEvent.value = e;
  // ... existing
}
```

### Lifecycle wiring inside the composable

```ts
// In useGanttPointer():
const dragStartFired = ref(false);

function begin(contentX: number, contentY: number): void {
  dragCommittedFlag.value = false;
  dragStartFired.value = false;  // NEW: reset lazy-start flag
  // ... existing hit-test + transaction-begin logic
}

function advance(contentX: number, contentY: number): void {
  const txn = transaction.value;
  if (!txn) return;
  // Update transaction (existing logic).
  if (txn.kind === 'bar-drag') {
    transaction.value = defaultPointerCaptureSession.advanceBarDrag(txn, {...});
  } else if (txn.kind === 'bar-resize') {
    transaction.value = defaultPointerCaptureSession.advanceBarResize(txn, {...});
  }
  // ... other kinds unchanged

  // NEW: lazy-fire start on first non-zero delta.
  if (!dragStartFired.value) {
    const updated = transaction.value;
    if (updated?.kind === 'bar-drag' && (updated.deltaX !== 0 || updated.deltaY !== 0)) {
      dragStartFired.value = true;
      input.onBarDragStart?.({ barId: updated.barId });
    } else if (updated?.kind === 'bar-resize' && updated.deltaX !== 0) {
      dragStartFired.value = true;
      input.onBarResizeStart?.({ barId: updated.barId, edge: updated.edge });
    }
  }
}

function commit(): void {
  const txn = transaction.value;
  if (!txn) return;

  // NEW: fire stop BEFORE the commit callback (k-ui order: stop → drop).
  if (dragStartFired.value) {
    if (txn.kind === 'bar-drag') {
      input.onBarDragStop?.({ barId: txn.barId });
    } else if (txn.kind === 'bar-resize') {
      input.onBarResizeStop?.({ barId: txn.barId, edge: txn.edge });
    }
  }

  // Existing commit logic (calls onBarDrop / onBarResize / etc.)
  if (txn.kind === 'bar-drag') commitDrag(...);
  // ... etc.

  dragCommittedFlag.value = true;
  transaction.value = null;
}

function abort(): void {
  // NEW: fire stop on abort too (k-ui fires regardless of mutation valid).
  const txn = transaction.value;
  if (dragStartFired.value && txn) {
    if (txn.kind === 'bar-drag') {
      input.onBarDragStop?.({ barId: txn.barId });
    } else if (txn.kind === 'bar-resize') {
      input.onBarResizeStop?.({ barId: txn.barId, edge: txn.edge });
    }
  }
  // Existing abort logic.
  transaction.value = null;
  lastHitResult.value = null;
}
```

### Adapter API after Phase 16

`<ChronixGantt>` gains:

```ts
// New emits
'bar-dragstart': (payload: BarDragStartPayload) => true;
'bar-dragstop': (payload: BarDragStopPayload) => true;
'bar-resizestart': (payload: BarResizeStartPayload) => true;
'bar-resizestop': (payload: BarResizeStopPayload) => true;
```

No new props. No internal state beyond the `lastJsEvent` ref already
described.

### Sample consumer

```vue
<script setup>
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type {
  BarDragStartPayload,
  BarDragStopPayload,
  BarDropPayload,
} from '@chronixjs/gantt-vue3';

const isDragging = ref<string | null>(null); // bar id or null

function onDragStart(p: BarDragStartPayload) {
  isDragging.value = p.barId;
}

function onDragStop(p: BarDragStopPayload) {
  isDragging.value = null;
}

function onBarDrop(p: BarDropPayload) {
  // Mutate bars; this fires AFTER dragstop.
}
</script>

<template>
  <div class="status">
    {{ isDragging ? `Dragging ${isDragging}` : 'idle' }}
  </div>
  <ChronixGantt
    :bars="bars"
    @bar-dragstart="onDragStart"
    @bar-dragstop="onDragStop"
    @bar-drop="onBarDrop"
  />
</template>
```

## Test coverage

### Composable lifecycle tests — `use-gantt-pointer.test.ts` (+6)

1. **0-delta drag** (begin → no advance → commit): NO `onBarDragStart`
   call; NO `onBarDragStop` call. Matches the "pure click" reference
   behavior.
2. **Non-zero drag** (begin → advance(10,0) → commit):
   `onBarDragStart` called once with `{ barId }`; `onBarDragStop`
   called once with `{ barId }`. Stop fires BEFORE the existing
   `onBarDrop` callback (verify call order).
3. **Multi-advance drag** (begin → advance(5,0) → advance(15,0) →
   commit): `onBarDragStart` called EXACTLY ONCE (not twice); stop
   fires once.
4. **Abort after non-zero advance**: `onBarDragStart` called;
   `onBarDragStop` called via abort path. `onBarDrop` NOT called.
5. **Resize 0-delta**: same as #1 but resize-start/stop, no calls.
6. **Resize non-zero**: same as #2 but resize variants; `edge` field
   propagated correctly.

### Adapter SFC tests — `chronix-gantt.test.ts` (+4)

7. **Drag a bar body**: `'bar-dragstart'` emitted with `{ barId,
sourceBar, jsEvent }`; `'bar-dragstop'` emitted at pointerup;
   `'bar-drop'` emitted AFTER `'bar-dragstop'`.
8. **Plain click on bar (0-delta)**: NO `'bar-dragstart'`; NO
   `'bar-dragstop'`; existing `'bar-click'` still fires correctly.
9. **Drag a bar end-edge**: `'bar-resizestart'` emitted with
   `{ barId, sourceBar, edge: 'end', jsEvent }`; `'bar-resizestop'`
   emitted at pointerup.
10. **Pointercancel mid-drag**: `'bar-dragstart'` emitted (drag was
    confirmed); `'bar-dragstop'` emitted; `'bar-drop'` NOT emitted.

**Total new tests: 10.** core 199 unchanged; vue3 164 → 174.
Chronix total **364 → 374.**

## VRT impact

**None.** No DOM change; no visual change; emits are runtime-only.
The 5 chronix VRT baselines should re-verify clean post-Commit 2.

## Execution plan — 2 commits + wrap-up

### Commit 1: composable extension + 6 lifecycle tests

- `adapters/vue3/src/use-gantt-pointer.ts`:
  - New types: `BarDragStartCallback`, `BarDragStopCallback`,
    `BarResizeStartCallback`, `BarResizeStopCallback`.
  - `UseGanttPointerInput` gains 4 optional callbacks
    (`onBarDragStart` etc).
  - `dragStartFired: Ref<boolean>` reset in `begin()`; set in
    `advance()` on first non-zero delta with fire of the
    corresponding start callback.
  - `commit()` + `abort()` fire stop callbacks when
    `dragStartFired.value` is true, BEFORE the existing commit
    callbacks. Reset `dragStartFired` at end of commit / abort (next
    `begin()` will also reset).
- `adapters/vue3/src/use-gantt-pointer.test.ts`: +6 lifecycle tests
  (0-delta / non-zero / multi-advance / abort / resize-0 / resize-nz).
- Build adapter (`pnpm --filter @chronixjs/gantt-vue3 build`) so the
  example app's vite picks up the new callback surface.
- ci-check green → commit.

### Commit 2: adapter wire-up + 4 SFC tests + demo

- `adapters/vue3/src/chronix-gantt.ts`:
  - New `lastJsEvent: Ref<PointerEvent | null>` set in `onPointerdown`
    and `onPointermove`.
  - `useGanttPointer({...})` call extended with 4 callback handlers
    that enrich `barId` (+ `edge`) into `{ barId, sourceBar, jsEvent }`
    (+ `edge`) and emit the 4 new events.
  - `emits` declaration extended with 4 new entries +
    `BarDragStartPayload` / `BarDragStopPayload` /
    `BarResizeStartPayload` / `BarResizeStopPayload` payload types
    exported from `adapters/vue3/src/use-gantt-pointer.ts` and
    re-exported via `index.ts`.
- `adapters/vue3/src/chronix-gantt.test.ts`: +4 SFC tests in a new
  `describe('<ChronixGantt> drag/resize lifecycle emits (Phase 16)', ...)`
  block.
- `examples/gantt-vue3/src/App.vue`:
  - `DemoEvent['kind']` enum gains 4 new entries.
  - 4 new handlers (`onBarDragStart` / `onBarDragStop` /
    `onBarResizeStart` / `onBarResizeStop`) write to the event panel.
- Browser-verify at demo 8702: drag a bar body — event panel shows
  `bar-dragstart → bar-dragstop → bar-drop` in order. Resize a bar
  edge — `bar-resizestart → bar-resizestop → bar-resize`. Plain click
  on a bar body — `bar-click` only, no dragstart/stop.
- VRT re-verify (should be idempotent — no DOM change).
- ci-check green → commit.

### Commit 3: wrap-up

- `audit/journal/2026-05-13.md` gets a Phase 16 section.
- This doc's Status → DONE with commit shas + final test counts.
- Memory `project_gantt_rewrite_plan.md` updated: 364 → 374; Phase 16
  added; 4 new public emits listed.

## Estimated scope

- Design doc: this commit (~45 min).
- Commit 1 (composable + 6 tests): ~1.5 hours.
- Commit 2 (adapter wire-up + 4 SFC tests + demo): ~1.5 hours.
- Commit 3 (wrap-up): ~30 min.
- Browser verify + VRT re-verify: ~15 min.
- **Total: ~4 hours focused work.** Smaller than Phase 14 because no
  UI / VRT rebaseline / new layout machinery.

## Open questions for the user

1. **Approve lazy-start-on-first-non-zero-advance** (matches reference
   behavior — pure clicks don't fire dragstart) over eager-start-at-
   begin (every pointerdown on a bar would fire dragstart even on
   click-aborted no-op drags)? Recommended: lazy. Reference parity +
   no spurious emits.

2. **Approve composable callbacks carrying just `{ barId }` (+ `edge`
   for resize)**, with the adapter enriching to
   `{ barId, sourceBar, jsEvent }` (+ `edge`) before `emit`?
   Alternative: pipe `sourceBar` + `jsEvent` through the composable's
   callback signature directly. Recommended: enrich at the adapter
   layer — composable stays event-source-agnostic and bar-array-free,
   matching the pattern that `useGanttPointer` doesn't currently take
   `bars` as input.

3. **Approve fire order on commit (stop → drop)** matching the
   reference? Alternative: drop → stop. Recommended: stop → drop —
   matches the reference's `handleDragEnd` line 450 then line 457+
   sequencing, and gives consumers a clean "lifecycle is over" signal
   before the mutation happens.

4. **Approve fire-on-abort behavior** ("stop fires even when no
   commit") matching the reference's "regardless of validMutation"
   semantics? Alternative: don't fire stop on abort. Recommended:
   fire — consumers' "drag started" state should reset symmetrically.

5. **Approve no `didCommit: boolean` flag on stop payload?**
   Consumer infers from "did `bar-drop` fire after `bar-dragstop` for
   this barId". Recommended: no flag — strict reference parity.
   Additive in a follow-up if it bites.

6. **Approve no progress-handle / calendar-range-select start/stop
   emits in this phase?** Both are parked in the catalog. Recommended:
   yes — narrow scope, reference doesn't expose either pair.

7. **Confirm no VRT baseline change?** No DOM change; emits are
   runtime-only.

Reply **"按照推荐继续"** to accept all defaults (lazy-start, payload
enrichment at adapter layer, stop→drop fire order, fire-on-abort, no
didCommit flag, narrow scope to drag/resize only, no VRT change).
