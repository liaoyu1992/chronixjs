# Phase 25 — drag-distance gate (5px Pythagorean)

**Status**: **DONE (2026-05-18)** — all 4 commits landed + /phase-close passed (6/6 gates) + ci-check green + parity-spec passes (kui Δ=0.00px chronix Δ=0.00px under 3-px wiggle). See `audit/journal/2026-05-13.md` "Phase 25" section for full wrap-up.

## Problem

chronix's pointer interaction layer has a **zero-delta abort** gate
in `<ChronixGantt>`'s `onPointerup` (chronix-gantt.ts:1380-1394):
when the user presses + releases without moving the pointer (`deltaX
== 0 && deltaY == 0`), the transaction aborts + the bar-click emit
fires. Any non-zero delta — even 1 px — commits the transaction as
a real drag/resize/range-select.

The parity reference uses a **5px Pythagorean distance threshold**
instead (`d:/work/k-ui/packages/gantt/src/interaction/dnd/FeaturefulElementDragging.ts:101-125`):
on every `onPointerMove`, computes `sqrt(deltaX² + deltaY²)`
against the pointerdown origin and only fires `dragstart` once the
distance is >= `minDistance` (default 5). Below threshold, the
release is treated as a click; above threshold, the drag commits.

User-observable consequence: a 1-4 px pointer "wiggle" between
pointerdown + pointerup currently commits a 1-4-px drag in chronix
but is suppressed as a click in the parity reference. The bar may
move (or resize) by a few pixels chronix-side that wouldn't move
parity-side. Caught + tracked in `audit/PARITY_RECHECK.md:135` as a
🟡 (visual / behavioral drift, not blocking for the recorded demo).

Phase 25 closes the gap. Also folds in the `selectMinDistance`
analog for `calendar-range-select` transactions per
`PARITY_RECHECK.md:402` ("Fold into Phase 25 drag-distance gate
scope explicitly").

## Reference (k-ui) behavior surface — full catalog

Reference files audited:

- `d:/work/k-ui/packages/gantt/src/interaction/dnd/FeaturefulElementDragging.ts:101-125` — `onPointerMove` checks `distanceSq = deltaX*deltaX + deltaY*deltaY` and calls `handleDistanceSurpassed(ev)` once `distanceSq >= minDistance * minDistance`. The check uses the squared form for performance (avoids `Math.sqrt`).
- `d:/work/k-ui/packages/gantt/src/interaction/dnd/FeaturefulElementDragging.ts:158-167` — `handleDelayEnd` + `handleDistanceSurpassed` are the two conditions that fire `dragstart`. Both must be satisfied (default `delay=undefined` collapses to "distance only"). chronix has no delay concept.
- `d:/work/k-ui/packages/gantt/src/interaction/dnd/FeaturefulElementDragging.ts:127-146` — `onPointerUp` short-circuits when `isDragging` is false. The transaction's drag-state was never entered (because `handleDistanceSurpassed` never fired), so `tryStopDrag` no-ops + no dragend / drop fires.
- `d:/work/k-ui/packages/gantt/src/interaction/interactions/EventDragging.ts:687-693` — `eventDragMinDistance` defaults to 5. Stored on the `FeaturefulElementDragging` instance at construction.
- `d:/work/k-ui/packages/gantt/src/interaction/interactions/DateSelecting.ts` — `selectMinDistance` defaults to 0 in some reference branches, 5 in others; verified against `FeaturefulElementDragging.ts` default. **Reference treats select threshold same as drag** when the option isn't set explicitly.
- `d:/work/k-ui/packages/gantt/src/interaction/dnd/PointerDragging.ts` — touch events follow the same threshold semantics as mouse events on the reference. The `touchScrollAllowed` flag controls whether the touch starts treated as drag vs scroll; that's orthogonal to the distance gate.

### Threshold semantics — squared distance, not Euclidean

K-ui's `distanceSq = deltaX*deltaX + deltaY*deltaY` then `distanceSq

> = minDistance \* minDistance`. Algebraically equivalent to
`sqrt(distanceSq) >= minDistance`. The squared form skips `Math.sqrt`
> (a few CPU cycles per pointermove — negligible in modern V8 but k-ui
> established the idiom anyway).

chronix can use either form. For clarity, the implementation will
use the **explicit squared comparison** to mirror the reference's
exact computation; consumers reading source will recognize the
pattern.

### Sticky "ever surpassed" flag — load-bearing

The threshold check fires per-pointermove. If the user pointermoves to
distance 6 (surpasses threshold → drag confirmed) then back to
distance 3 then releases → the transaction's CURRENT deltaX/deltaY at
release reflect "distance 3" (sub-threshold). But the drag IS
confirmed because the threshold was surpassed at some point during
the gesture.

K-ui handles this via `isDistanceSurpassed: boolean` instance field
on the `FeaturefulElementDragging` session — set to `true` once
surpassed, NEVER reset within the same gesture. chronix needs the
same: a sticky boolean tracking "did distance ever reach threshold
during this transaction's lifetime?"

The release-time decision (abort-vs-commit) reads the sticky flag,
not the current deltaX/deltaY.

### Touch vs mouse — uniform in chronix v0

Reference allows different `minDistance` per pointer type via the
options API (`eventDragMinDistance` for mouse, `eventLongPressDelay`
for touch). chronix v0 has no pointer-type-aware composable inputs

- no long-press concept. Phase 25 ships a single
  `pointerMinDistance` threshold that applies uniformly to all pointer
  types (mouse / touch / pen).

This is a deliberate v0 simplification, parked behind the
defer-indefinite `eventLongPressDelay` cluster (`SILENT_GAP_SWEEP`)
that would also revisit per-pointer-type ergonomics if a consumer
needs it.

### Surface-level disposition table

| Item                                                                                       | k-ui                                                                      | chronix v0                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `minDistance` field on `FeaturefulElementDragging`                                         | `FeaturefulElementDragging.ts:80` (constructor)                           | ✅ **port** as `pointerMinDistance?: MaybeRefOrGetter<number>` input on `useGanttPointer` composable + matching `pointerMinDistance?: number` prop on `<ChronixGantt>`. Default 5 (matches reference).                                                                                                                                     |
| `distanceSq >= minDistance * minDistance` Pythagorean check                                | `FeaturefulElementDragging.ts:108-112`                                    | ✅ **port verbatim** — squared comparison, no `Math.sqrt`. Computed against `originPx` already stored on each transaction (added Phase 3).                                                                                                                                                                                                 |
| `isDistanceSurpassed: boolean` sticky flag                                                 | `FeaturefulElementDragging.ts` instance field                             | ✅ **port** as `dragDistanceSurpassed: Ref<boolean>` in the composable's setup scope. Sibling to existing `dragStartFired` + `dragCommittedFlag`. Reset on `begin()`; set to `true` on the first `advance()` where Pythagorean distance >= threshold; STAYS true through subsequent advances even if pointer drifts back inside threshold. |
| `dragstart` lazy-fire gated on threshold surpass                                           | `FeaturefulElementDragging.ts:106-112` → `handleDistanceSurpassed`        | ✅ **port** — modify the existing Phase 16 lazy-fire (`dragStartFired` latch in `advance()`) to additionally require `dragDistanceSurpassed === true`. Currently lazy-fires on first non-zero delta; will lazy-fire on first delta past threshold.                                                                                         |
| `dragstop` short-circuit when `isDragging === false`                                       | `FeaturefulElementDragging.ts:136-139`                                    | ✅ **port** — existing Phase 16 contract already gates `dragStop` on `dragStartFired`. Since Phase 25 makes `dragStartFired` require `dragDistanceSurpassed`, sub-threshold gestures naturally skip both start AND stop. No new code needed.                                                                                               |
| Abort on sub-threshold pointer-up (treat as click)                                         | k-ui implicit: dragstart never fired → onPointerUp short-circuits → click | ✅ **port** — expand the adapter's `isNoOpDrag` check in `chronix-gantt.ts` `onPointerup` to use `!pointer.dragDistanceSurpassed.value` instead of `deltaX === 0 && deltaY === 0`. Sub-threshold transactions abort → click fires.                                                                                                         |
| `selectMinDistance` for `DateSelecting`                                                    | `DateSelecting.ts` constructor accepts it                                 | ✅ **port (single shared threshold)** — `pointerMinDistance` applies to ALL 4 transaction kinds uniformly (bar-drag, bar-resize, progress-handle, calendar-range-select). k-ui's separation (`eventDragMinDistance` vs `selectMinDistance`) is over-flexible for chronix v0; document as parked variant.                                   |
| Touch vs mouse threshold differentiation                                                   | k-ui has per-type defaults (touch=long-press, mouse=distance)             | ⏸️ **parked** — chronix v0 has no pointer-type-aware composable surface. Re-prioritize bundled with `eventLongPressDelay` defer-indefinite cluster.                                                                                                                                                                                        |
| `eventDragMinDistance` separate from `selectMinDistance` (per-transaction-kind thresholds) | k-ui supports per-kind via separate options                               | ⏸️ **parked** — single `pointerMinDistance` for v0. Re-prioritize on consumer demand for kind-specific thresholds.                                                                                                                                                                                                                         |
| `delay` (timer-based gate) — `FeaturefulElementDragging.ts:148-157`                        | k-ui supports per-gesture delay                                           | ❌ **Reject** — chronix has no delay concept anywhere; adding a setTimeout-driven gate to one composable would be architectural drift. Re-prioritize when long-press + chronix lifecycle-hook stories converge (Phase 31+).                                                                                                                |
| Progress-handle transaction threshold                                                      | k-ui treats progress-handle drag with same `minDistance` as bar-drag      | ✅ **port** — `pointerMinDistance` applies to `progress-handle` too. Same Pythagorean check (originPx is stored on the ProgressHandleTransaction shape from Phase 3.x).                                                                                                                                                                    |
| Calendar-range-select transaction threshold                                                | k-ui's `selectMinDistance`                                                | ✅ **port** — chronix's existing 0-delta check (`currentTime.getTime() === anchorTime.getTime()`) is replaced by the Pythagorean distance check against the pointerdown content-x/y origin. The select transaction shape gains nothing new; the composable tracks `originPx` for the gesture independent of the transaction shape.         |
| Sub-threshold transaction's deltaX/deltaY at commit                                        | k-ui never commits sub-threshold gestures (dragstart was never fired)     | ✅ **port** — chronix's `commit()` early-returns when `dragDistanceSurpassed === false` (treats as abort). Symmetric to the current `wasDragCommit` flag wiring.                                                                                                                                                                           |
| `applyOnTrack` / `track` enum for drag direction                                           | k-ui has it for axis-locked drags                                         | ⏸️ **parked** — chronix has no axis-lock surface; defer-indefinite.                                                                                                                                                                                                                                                                        |

**Phase 25 net surface**: 8 ✅-port items (threshold field + Pythagorean check + sticky flag + lazy-fire gate + adapter abort-vs-commit + progress + select + commit-time guard), 2 ⏸️-parked (touch differentiation; per-kind thresholds), 2 ❌-reject (delay timer; axis-lock).

### Naming alignment table

| k-ui                                  | chronix                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| `minDistance` (field)                 | `pointerMinDistance` (component prop + composable input — chronix-prefixed by surface) |
| `isDistanceSurpassed` (instance flag) | `dragDistanceSurpassed` (Ref<boolean> in composable scope)                             |
| `handleDistanceSurpassed`             | (no public method — inlined in `advance()`)                                            |
| `eventDragMinDistance`                | `pointerMinDistance` (shared with select; per-kind variant parked)                     |
| `selectMinDistance`                   | `pointerMinDistance` (shared; per-kind variant parked)                                 |
| `distanceSq` (local var)              | `distanceSq` (local var — preserved verbatim for readability)                          |

## Approach

### §1 — Composable input + scope state (`adapters/vue3/src/use-gantt-pointer.ts`)

Add to `UseGanttPointerInput`:

```ts
/**
 * Phase 25: minimum Pythagorean distance (in pixels) from the
 * pointerdown origin before the active transaction is treated as a
 * confirmed drag. Below this threshold, pointer-up aborts the
 * transaction + the adapter fires the `bar-click` emit instead.
 *
 * Default 5 (matches the parity reference's `minDistance`). Set to
 * `0` to disable the gate (every non-zero delta commits — chronix
 * pre-Phase-25 behavior).
 *
 * Applies uniformly to all 4 transaction kinds (bar-drag, bar-resize,
 * progress-handle, calendar-range-select). Per-kind thresholds
 * (k-ui's eventDragMinDistance vs selectMinDistance separation) are
 * parked until consumer demand surfaces.
 */
readonly pointerMinDistance?: MaybeRefOrGetter<number>;
```

Add to `UseGanttPointerOutput`:

```ts
/**
 * Phase 25: `true` once the active transaction's pointer has moved
 * at least `pointerMinDistance` pixels (Pythagorean) from the
 * pointerdown origin. Sticky: stays `true` for the rest of the
 * gesture even if pointer drifts back inside the threshold. Reset
 * to `false` at the next `begin()`.
 *
 * Read by the adapter's `onPointerup` to decide abort-vs-commit:
 * when `false` at release time, the transaction aborts as a click;
 * when `true`, the transaction commits as a real drag.
 */
readonly dragDistanceSurpassed: ComputedRef<boolean>;
```

Add to composable setup scope:

```ts
const dragDistanceSurpassedFlag = ref(false);
```

Reset in `begin()`:

```ts
dragDistanceSurpassedFlag.value = false; // sibling of existing dragStartFired + dragCommittedFlag reset
```

Update `advance()` distance check (after the existing transaction.value reassignment):

```ts
const updated = transaction.value;
if (updated && 'originPx' in updated && !dragDistanceSurpassedFlag.value) {
  const minDistance = toValue(input.pointerMinDistance ?? 5);
  const minDistanceSq = minDistance * minDistance;
  // deltaX/deltaY already on the updated transaction shape; equivalent
  // to (currentPx - originPx).
  const deltaX = 'deltaX' in updated ? updated.deltaX : 0;
  const deltaY = 'deltaY' in updated ? updated.deltaY : 0;
  const distanceSq = deltaX * deltaX + deltaY * deltaY;
  if (distanceSq >= minDistanceSq) {
    dragDistanceSurpassedFlag.value = true;
  }
}

// CalendarRangeSelectTransaction doesn't expose deltaX/deltaY (time-
// domain shape) — compute distance in pixel-space from the composable's
// own tracking. Achieved by capturing `originPx` in a composable-scope
// ref at `begin()` and comparing against the most recent `advance()`'s
// contentX/contentY.
```

Wait — `CalendarRangeSelectTransaction` doesn't have `deltaX`/`deltaY`
fields. Its delta is computed time-side. Phase 25 needs the
pixel-distance gate to apply to selects too. Solution: track the
pointerdown contentX/contentY in a composable-scope ref AND the most
recent advance contentX/contentY. Compute distance from those, not
from the transaction shape.

Revised:

```ts
// Composable scope (new):
const lastBeginPx = ref<{ x: number; y: number } | null>(null);
const lastAdvancePx = ref<{ x: number; y: number } | null>(null);

// begin():
lastBeginPx.value = { x: contentX, y: contentY };
lastAdvancePx.value = null;
dragDistanceSurpassedFlag.value = false;

// advance() — at the end, after the transaction.value reassignment:
lastAdvancePx.value = { x: contentX, y: contentY };
if (!dragDistanceSurpassedFlag.value && lastBeginPx.value) {
  const minDistance = toValue(input.pointerMinDistance ?? 5);
  const dx = contentX - lastBeginPx.value.x;
  const dy = contentY - lastBeginPx.value.y;
  if (dx * dx + dy * dy >= minDistance * minDistance) {
    dragDistanceSurpassedFlag.value = true;
  }
}
```

This handles all 4 transaction kinds uniformly (no per-shape branching).

Update Phase 16 lazy-fire (existing block at lines 484-493):

```ts
if (!dragStartFired.value && dragDistanceSurpassedFlag.value) {
  // ← add second condition
  const updated = transaction.value;
  if (updated?.kind === 'bar-drag') {
    dragStartFired.value = true;
    input.onBarDragStart?.({ barId: updated.barId });
  } else if (updated?.kind === 'bar-resize') {
    dragStartFired.value = true;
    input.onBarResizeStart?.({ barId: updated.barId, edge: updated.edge });
  }
}
```

Note: the inner non-zero-delta check is dropped because
`dragDistanceSurpassedFlag` already encodes "distance > 0" (in fact
"distance >= 5"). The Phase 16 latch + Phase 25 sticky-flag together
guarantee dragStart fires AT MOST ONCE per gesture and ONLY after
distance threshold.

Output: expose `dragDistanceSurpassed` as a computed ref:

```ts
dragDistanceSurpassed: computed(() => dragDistanceSurpassedFlag.value),
```

### §2 — Adapter integration (`adapters/vue3/src/chronix-gantt.ts`)

Add new prop:

```ts
/**
 * Phase 25: minimum Pythagorean distance (in pixels) from the
 * pointerdown origin before a pointer gesture is treated as a
 * confirmed drag/resize/range-select. Below this threshold, the
 * pointer-up fires `'bar-click'` / `'empty-area-click'` instead of
 * the commit-time emit. Default 5 (matches the parity reference).
 *
 * Set to `0` to restore the pre-Phase-25 strict-zero-delta gate
 * (every non-zero delta commits) — only useful for chronix migration
 * scenarios where existing tests asserted on sub-threshold behavior.
 */
pointerMinDistance: { type: Number, default: 5 },
```

Thread to composable:

```ts
const pointer = useGanttPointer({
  // ...existing inputs
  pointerMinDistance: () => props.pointerMinDistance,
});
```

Update `isNoOpDrag` check in `onPointerup` (lines 1380-1394):

```ts
// Phase 25: replace the strict 0-delta check with the composable's
// distance-surpassed flag. Sub-threshold gestures (deltaX² + deltaY²
// < pointerMinDistance²) abort at commit-time → fire `'bar-click'` /
// `'empty-area-click'`. Progress-handle transactions still commit
// regardless — reaching the handle hit zone IS the intent
// (consistent with pre-Phase-25 behavior).
const isSubThresholdGesture =
  !pointer.dragDistanceSurpassed.value && txn.kind !== 'progress-handle';
if (isSubThresholdGesture) {
  pointer.abort();
} else {
  pointer.commit();
}
```

The old `isNoOpDrag` check folded into the new `isSubThresholdGesture`
check (when threshold=0, the equivalent check fires at first non-zero
delta; same behavior as pre-Phase-25). Progress-handle stays exempted
(reaching the handle IS the intent — k-ui does the same).

### §3 — Sample consumer

```vue
<template>
  <!-- Default 5-px threshold matches parity reference -->
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :editable="true"
    :selectable="true"
  />

  <!-- Permissive 0-px (every non-zero delta commits) -->
  <ChronixGantt v-bind="basicProps" :pointer-min-distance="0" />

  <!-- Strict 10-px (large wiggle tolerance) -->
  <ChronixGantt v-bind="basicProps" :pointer-min-distance="10" />
</template>
```

No new emits or runtime types — Phase 25 is purely a behavior
adjustment on the existing emit surface.

### Alternatives considered

- **Adapter-only gate** (check Pythagorean distance in
  `chronix-gantt.ts`'s `onPointerup` using `txn.deltaX` / `txn.deltaY`;
  composable unchanged). Reject. Protocol bug: dragStart fires at
  first non-zero delta (existing Phase 16 lazy-fire), then commit
  aborts due to sub-threshold distance → dragStart with no matching
  dragStop. Protocol violation. Composable-level gate keeps
  start/stop pairing intact.
- **Core transaction-level state** (add `distanceSurpassed: boolean`
  field to each transaction shape). Reject. Breaks the
  "transactions are pure immutable data" invariant; ripples through
  every fixture test (probably 8+ files). The sticky flag is a
  composable-instance concern, not a transaction shape concern.
- **Separate `dragMinDistance` + `selectMinDistance` props** (match
  k-ui's option separation). Reject for v0. Single
  `pointerMinDistance` shared across all 4 transaction kinds covers
  the common case; the kind-specific variant is parked.
- **`{ mouse: 5, touch: 0, pen: 5 }` per-pointer-type object prop**.
  Reject for v0. chronix doesn't distinguish pointer types anywhere
  else in the composable inputs; adding plumbing for this would be
  premature complexity.
- **Time-based delay gate** (k-ui's `delay` option). Reject. No
  chronix lifecycle-hook story; setTimeout-driven gate would be
  architectural drift.

## Parity assertion plan — MANDATORY

The drag-distance gate IS parity-testable. Both demos can be driven
via Playwright pointer events with sub-threshold (3 px) vs above-
threshold (10 px) movements; we assert that the sub-threshold path
fires `bar-click` (no `bar-drop`) on both sides, and the above-
threshold path fires `bar-drop` on both sides.

The chronix demo already wires `bar-click` and `bar-drop` to console
log entries the test can probe; the parity reference wires similar
log entries.

| Assertion id (in parity.spec.ts)                                                                      | Drives k-ui demo via                                                           | Drives chronix demo via                    | Compares                                                                                                                                                                                                                      | Tolerance |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `phase25-sub-threshold pointer wiggle does NOT commit a drag on either side (3 px wiggle, week view)` | `loadBothDemos` → simulate pointerdown on a bar + 3-px pointermove + pointerup | Same gesture on chronix's parity-mode demo | Compare per-side log entries: neither side should emit `bar-drop` (no commit). Both sides may emit `bar-click` (commit-as-click). Tolerance: bar's `range.start.getTime()` unchanged on both sides (no drag-committed delta). | exact     |

1 assertion covers the load-bearing invariant (sub-threshold wiggle
is suppressed on both sides). Above-threshold (the existing demo
gestures with 50+ px moves) is already implicitly covered by every
prior parity test that drives drags — no new above-threshold
assertion needed.

### Drift-detection scope

- **Covered**: sub-threshold pointer-wiggle suppression on both
  sides. Above-threshold drag commit (implicit via every prior
  parity assertion that exercises drags).
- **NOT covered (cross-demo)**:
  - Per-pointer-type behavior (touch vs mouse) — chronix v0 doesn't
    distinguish; parked.
  - Per-transaction-kind thresholds (drag vs select with different
    minDistance) — chronix v0 shares; parked.
  - Hysteresis behavior (surpass then drift back below threshold) —
    pinned by composable unit test; cross-demo parity is structurally
    same as the at-threshold case.

## Test coverage

- **adapter** — `adapters/vue3/src/use-gantt-pointer.test.ts` (~6 new tests):
  - default `pointerMinDistance=5` — 3-px Pythagorean advance leaves `dragDistanceSurpassed=false`
  - 5-px Pythagorean advance flips `dragDistanceSurpassed=true`
  - 4×3 (= 5 Pythagorean) advance flips it true (exact-boundary case)
  - sticky behavior: surpass at advance 1, drift back at advance 2, flag stays true
  - `pointerMinDistance=0` disables the gate (any non-zero delta surpasses)
  - applies to all 4 transaction kinds (bar-drag, bar-resize, progress-handle, calendar-range-select)

- **adapter** — `adapters/vue3/src/chronix-gantt-drag-distance.test.ts` (new, ~6 tests):
  - sub-threshold pointer-wiggle (3 px) fires `bar-click` not `bar-drop`
  - above-threshold pointer-wiggle (10 px) fires `bar-drop` not `bar-click`
  - `pointerMinDistance=0` restores pre-Phase-25 behavior (any non-zero delta commits)
  - sub-threshold resize gesture doesn't commit a resize
  - sub-threshold select gesture doesn't commit a select
  - progress-handle gesture commits regardless of distance (handle hit = intent)

- **parity** — `tooling/golden-runner/tests/parity.spec.ts` (+1 assertion):
  Per the table above — sub-threshold wiggle suppression parity.

Expected counts after Phase 25:

- vitest: 672 → ~684 (+12: 6 composable + 6 adapter SFC tests).
- parity-spec: 53 → 54 (+1 phase25-sub-threshold).
- ChronixTheme tokens: 50 unchanged.
- cross-demo verify scenarios: 27 unchanged (gestures are above-threshold throughout the cross-demo capture set).
- chronix-visual: 5 baselines unchanged (no render-time change).

## VRT impact

- **chronix-visual baselines** (5): zero pixel change. Phase 25 changes runtime gesture-handling logic only; no render-time DOM emission changes.
- **cross-demo VRT baselines** (27): zero pixel change. Same reason.
- **No new VRT scenarios** — the 1 parity assertion exercises pointer events programmatically + reads emit logs, not pixels.

Predicted re-baseline count: **0 PNGs**. Returns to the 0-VRT pattern after Phase 23's structural change broke the streak.

## Execution plan — 3 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_25_DRAG_DISTANCE_GATE_DESIGN.md`. Awaits user
confirmation of the 3 decisions before implementation.

### Commit 2: Composable + adapter — ~12 tests

- `adapters/vue3/src/use-gantt-pointer.ts` (~50 LOC modified):
  - New input field `pointerMinDistance?: MaybeRefOrGetter<number>`.
  - New output ref `dragDistanceSurpassed: ComputedRef<boolean>`.
  - New scope refs `dragDistanceSurpassedFlag` + `lastBeginPx`.
  - `begin()` resets `dragDistanceSurpassedFlag = false`, captures `lastBeginPx = { x: contentX, y: contentY }`.
  - `advance()` end-of-block: computes distance from `lastBeginPx`; flips flag when `distanceSq >= minDistance * minDistance`.
  - Phase 16 lazy-fire `dragStartFired` gate adds `&& dragDistanceSurpassedFlag.value` precondition.
- `adapters/vue3/src/chronix-gantt.ts` (~15 LOC modified):
  - New prop `pointerMinDistance: { type: Number, default: 5 }`.
  - Threaded into `useGanttPointer({...})`.
  - `onPointerup`'s `isNoOpDrag` check replaced with `isSubThresholdGesture` (reads `!pointer.dragDistanceSurpassed.value`); progress-handle stays exempted.
- `adapters/vue3/src/use-gantt-pointer.test.ts` (+6 tests, ~150 LOC).
- `adapters/vue3/src/chronix-gantt-drag-distance.test.ts` (new, ~6 tests, ~180 LOC).
- Rebuild `@chronixjs/gantt-vue3` dist.
- ci-check green (vitest 672 → ~684).

### Commit 3: Parity assertion

- `tooling/golden-runner/tests/parity.spec.ts` (+~70 LOC, +1 assertion): `phase25-sub-threshold pointer wiggle does NOT commit a drag` cross-demo parity assertion.
- Run parity.spec.ts — new assertion should pass on both sides.
- ci-check green; cross-demo-verify gate green (27/27 unchanged).

### Commit 4 (wrap-up — REQUIRES `/phase-close` invocation)

- `audit/journal/2026-05-13.md`: "Phase 25 — drag-distance gate (DONE, YYYY-MM-DD)" section.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 672 → ~684; parity-spec 53 → 54; theme tokens 50 unchanged; add Phase 25 DONE marker.
- `audit/PHASE_25_DRAG_DISTANCE_GATE_DESIGN.md` Status → DONE.
- Update `audit/PARITY_RECHECK.md` rows 135 + 294 + 353 + 402 → DONE Phase 25.

## Estimated scope

| Commit                              | Hours   | LOC est.                       |
| ----------------------------------- | ------- | ------------------------------ |
| 1 (design doc)                      | 0.5     | this file (~450 LOC)           |
| 2 (composable + adapter + 12 tests) | 2       | ~65 LOC src + ~330 LOC tests   |
| 3 (parity assertion)                | 0.75    | ~70 LOC parity test            |
| 4 (wrap-up)                         | 0.25    | journal + memory + status flip |
| **Total**                           | **3.5** | ~915 LOC + 0 baseline PNGs     |

Within single-session discipline. Matches the 3h memory estimate.

## 4-dimension audit check

| Dimension                     | Coverage in Phase 25                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Options surface**           | 1 new component-prop (`pointerMinDistance`, default 5). 1 new composable input + output. No new types, no new theme tokens.                                                                                                                                                                                                                                  |
| **Render code**               | Zero impact. No DOM emission changes; purely a runtime gesture-handling adjustment.                                                                                                                                                                                                                                                                          |
| **Interaction code**          | LOAD-BEARING. New sticky `dragDistanceSurpassedFlag` in composable scope; `advance()` computes Pythagorean distance + flips flag; Phase 16 `dragStartFired` lazy-fire gates on the new flag; adapter's `isNoOpDrag` → `isSubThresholdGesture` rewrite. Existing tests' larger pointer moves (50+ px) continue to commit normally; sub-threshold tests added. |
| **Layout-algorithm pipeline** | Zero impact. PlannedAxis / placedBars / RoutedLink shapes all unchanged. AxisRangePlanner / RowSwimlaneLayout / BarPlacementPass / LinkRouter all unchanged.                                                                                                                                                                                                 |

## Open questions for the user — 3 load-bearing decisions

**1. Threshold model: A (single `pointerMinDistance` option, default 5px, applies to all 4 transaction kinds) / B (separate `dragMinDistance` + `selectMinDistance` mirroring k-ui's separation) / C (per-kind object — `pointerMinDistance: { drag: 5, resize: 5, select: 5, progress: 0 }`)** — recommend **A**.

- **A (recommended)**: simplest API + covers the parity-restoration goal completely. One number. Default 5 matches reference's `eventDragMinDistance`. Consumer mental model: "below this, I get a click; above, I get a drag." Same threshold for all 4 transaction kinds is the v0 chronix simplification.
- **B**: 2 props mirroring k-ui's separation. Cost: 2x props to learn; the v0 use case (different thresholds for drag vs select) is rare in practice. Adds API surface for theoretical flexibility.
- **C**: per-kind object. Most flexible, biggest API surface. Defer until consumer demands per-kind thresholds.

**Recommendation**: **A**. Single `pointerMinDistance: number` (default 5). Per-kind variant parked.

**2. Gate placement: A (composable-level — `useGanttPointer`'s scope tracks `dragDistanceSurpassedFlag` sticky flag; advance() computes distance; adapter reads flag for abort-vs-commit) / B (adapter-only — Pythagorean check in `chronix-gantt.ts` onPointerup using `txn.deltaX`/`txn.deltaY`; composable unchanged) / C (core transaction-level — add `distanceSurpassed: boolean` field to each transaction shape)** — recommend **A**.

- **A (recommended)**: matches k-ui's `FeaturefulElementDragging.isDistanceSurpassed` semantics. Composable owns the lifecycle invariants: dragStart fires only after threshold, dragStop fires only if dragStart fired, abort fires when sub-threshold. Clean. Phase 16 lazy-fire gate gets one new precondition; no protocol violations possible.
- **B**: adapter-only check. Protocol bug: dragStart fires at first non-zero delta (Phase 16 existing latch), then commit aborts due to sub-threshold distance → dragStart with no matching dragStop. Protocol violation in the emit sequence.
- **C**: core gets state on the immutable transaction shape. Breaks "transactions are pure data" model + ripples through every fixture test (8+ files).

**Recommendation**: **A**. The composable IS the natural home for gesture lifecycle state.

**3. Touch handling: A (uniform 5px threshold for all pointer types — touch + mouse + pen treated identically) / B (touch defaults to 0px per k-ui's per-type model — requires reading `PointerEvent.pointerType` in the adapter + threading into composable) / C (per-type object — `pointerMinDistance: { mouse: 5, touch: 0, pen: 5 }`)** — recommend **A**.

- **A (recommended)**: chronix doesn't distinguish pointer types anywhere else in the composable surface. Uniform 5px for all types is the simpler model; touch-specific ergonomics deferred bundled with `eventLongPressDelay` (which is also defer-indefinite).
- **B**: requires reading `e.pointerType` in `<ChronixGantt>`'s `onPointerdown` + storing per-gesture + threading into composable + composable reads it for threshold lookup. Plumbing for a feature few consumers will exercise differently.
- **C**: full per-type config. Most flexible, biggest API surface.

**Recommendation**: **A**. Touch/mouse/pen uniform. v0 trade-off documented; re-prioritize when long-press story lands.

Reply **按推荐继续** to accept all three (A / A / A), or call out
any 1-3 to override.
