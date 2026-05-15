# Phase 9 — Cross-row bar drag (rowId resolution on Y-cross)

**Status**: Approved (2026-05-15). Implementation in progress.

## Problem

Chronix's `BarDragTransaction` already tracks `deltaY` and the
adapter already shifts a dragging bar's `renderY` by `deltaY` mid-
drag — so the bar visually follows the pointer across rows. **But
the commit discards `deltaY`**: `commitBarDrag` outputs only
`resolvedRange` (time-delta applied to the bar's range), no
`resolvedRowId`. On `pointerup` the bar snaps back to its original
row regardless of where the pointer landed.

The reference demo lets a user grab a bar in workshop-A and drop
it on workshop-D; the bar's `resourceId` updates and the new
placement persists. Today chronix lets the user visually drag
across rows but commits a no-op for the row change. **This is the
most visible interaction parity gap left** post-Phase 8.

This phase resolves Y to a `rowId` at commit time (and during
advance for the live snap-preview), threads it through to
`BarDropPayload`, and demonstrates the round-trip in the demo.

## Reference (k-ui) behavior surface — full catalog

Walked `packages/gantt/src/interaction/interactions/EventDragging.ts`,
`packages/gantt/src/internal/interactions/HitDragging.ts` (via
imports), and the demo's `onEventDrop` callback flow. Each item is
marked ✅ done / ⏸️ parked / ❌ rejected for Phase 9.

### Y → row resolution

1. ✅ **Resolve current `rowId` from pointer y mid-drag.** k-ui's
   `HitDragging` produces a `hit1` whose `dateSpan.resourceId` is
   the row the pointer is currently over. Chronix port: a pure
   `defaultStripResolver.atY(y, strips)` that linear-scans strips
   and returns the matching `rowId` (or `null` if y falls outside
   all strips). O(strips); chronix demos have ≤ 32 strips.
2. ✅ **Live preview snaps to target strip's Y.** k-ui's mirror
   sits at the new resource's Y while the cursor moves between
   rows — not free-floating off-row. Chronix port: when `advance`
   detects `projectedRowId !== sourceRowId`, the adapter's render
   path computes `renderY = targetStrip.y + (bar.y - sourceStrip.y)`
   so the bar slots into the target strip at the same intra-strip
   offset.
3. ✅ **Drop outside all strips falls back to source `rowId`.**
   k-ui's mutation reverts when `hit1` is null. Chronix port:
   `defaultStripResolver.atY` returns `null` → adapter commits with
   `newRowId = originalRowId`.
4. ⏸️ **Drag-validity hooks** (`eventAllow`, `resourceAllow`,
   `editable === false` per-bar, droppable check) — parked. The
   chronix v0 IR has no per-bar editable / droppable field; all
   bars are editable when `<ChronixGantt editable>` is true.
5. ⏸️ **Overlap rejection** (drop would put two bars on the same
   row at overlapping times → revert) — parked. k-ui has
   `eventOverlap: false / function` option. chronix has no
   overlap policy yet; even within a row, two bars at the same
   time stack visually rather than reject.
6. ⏸️ **Snap to multi-day boundaries** when the drag duration
   exceeds a row's allDay threshold — rejected for v0; chronix
   doesn't differentiate timed vs all-day events.
7. ⏸️ **Multi-resource events** (`resourceIds: string[]`) — k-ui
   supports a bar belonging to multiple resources. chronix's
   `BarSpec.rowId: string` is single-valued by IR design. Parked
   until the IR grows a multi-row field.

### Transaction shape

8. ✅ **Keep `BarDragTransaction` IR-stable.** No new fields on the
   transaction itself; row resolution lives in a separate utility
   the composable consumes. Same precedent as Phase 8 keeping
   `RoutedLinkMarker` on the routing output even though
   `<defs>+marker-end` made it redundant — the IR stays clean.
9. ✅ **Live `projectedRowId` exposed via the composable.** The
   composable computes `projectedRowId: ComputedRef<string | null>`
   from `defaultStripResolver.atY(originPx.y + deltaY, strips)`.
   The adapter consumes it in the render function to drive the
   snap behavior; SFC consumers can read it too.
10. ⏸️ **`BarDragTransaction.projectedRowId` field** (alternative
    location) — rejected for v0. Would push strip awareness into
    the core `interaction/` layer that's currently DOM-free and
    layout-free. Keeping resolution in the composable preserves
    the layer separation.

### Commit payload

11. ✅ **`BarDropPayload` gains `oldRowId` + `newRowId`.** Always
    present (not optional) so consumers can write back
    unconditionally; `newRowId === oldRowId` when the drop lands
    on the same row or outside all strips.
12. ⏸️ **`bar-drop-cancelled` event** for drops that reverted
    (e.g. `newRowId === oldRowId` because of an out-of-strip
    drop) — parked. Consumers can detect via `newRowId === oldRowId
&& oldRange === newRange`; the composable doesn't need a new
    event channel.
13. ⏸️ **Drag-preview emit channel** (`bar-drag-update`) so a
    consumer can react mid-drag (e.g. update a status bar) —
    parked. K-ui's `eventDragStart` / `eventDrag` hooks aren't
    plumbed in chronix v0; the live `projectedRowId` ref is the
    extension point if a consumer wants it.

### Visual feedback

14. ✅ **Bar's intra-strip offset preserved.** When the bar lands
    in a new strip, the visual offset within the strip stays the
    same. E.g. if the bar was 8 px below the source strip's top,
    it sits 8 px below the target strip's top mid-drag.
15. ⏸️ **Cursor changes** (`row-resize` style cursor when over a
    drop-valid row, `not-allowed` when over an invalid row) —
    parked. K-ui uses `enableCursor()` / `disableCursor()` from
    its drag-impl module. chronix doesn't have a cursor-management
    layer yet.
16. ⏸️ **Mirror element with reduced opacity** during drag — k-ui
    paints a half-opacity copy of the bar at the drag position.
    chronix today moves the original bar directly. Parked; the
    direct-move approach is simpler and visually clear without
    a separate mirror.
17. ❌ **Multi-bar selection-drag** (select multiple bars then drag
    them together) — rejected; no selection model in chronix.

### Edge cases

18. ✅ **Drop within source row.** `projectedRowId === sourceRowId`
    → no row change, only time delta applies. Standard path.
19. ✅ **Drop on the strip-divider row (between rows).** With
    `rowSpacing > 0` (default 1) the 1-px gap between strips
    geometrically belongs to no strip. `defaultStripResolver.atY`
    returns `null`; commit falls back to source row.
20. ✅ **Drag outside body SVG (above header or below content).**
    `originPx.y + deltaY` can be negative or > totalHeight.
    `defaultStripResolver.atY` returns `null`; falls back.
21. ⏸️ **Auto-scroll on edge-drag** (drag near top/bottom of
    viewport → wrapper scrolls automatically) — parked. K-ui has
    an `AutoScroller` module; chronix has no equivalent yet.
22. ⏸️ **Pointer-capture across the gap.** With `rowSpacing > 0`,
    a fast drag could in principle skip over a 1-px gap without
    `advance` firing during that frame. With pointer capture
    set on `pointerdown` (already wired in chronix), `pointermove`
    fires for every frame the pointer moves, so this isn't a
    practical issue. Not protected against explicitly.

## Approach

### New core utility: `defaultStripResolver`

`packages/gantt/src/interaction/swimlane-strip-at-y.ts`:

```ts
import type { SwimlaneStrip } from '../layout/types.js';

export interface SwimlaneStripResolver {
  /**
   * Return the `rowId` of the strip whose Y range contains the
   * given content-y, or `null` if y lies above the first strip,
   * below the last strip, or in an inter-strip gap (when
   * `rowSpacing > 0`).
   *
   * O(strips) linear scan. For chronix's demo (≤ 32 strips)
   * this is well below the latency threshold even at pointermove
   * frequency. A future virtualized variant could binary-search,
   * but YAGNI until profiling shows it.
   */
  atY(y: number, strips: readonly SwimlaneStrip[]): string | null;
}

export const defaultStripResolver: SwimlaneStripResolver = {
  atY(y, strips) {
    for (const strip of strips) {
      if (y >= strip.y && y < strip.y + strip.height) {
        return strip.rowId;
      }
    }
    return null;
  },
};
```

Exported from `@chronixjs/gantt`'s top-level `index.ts` alongside
`defaultPointerHitTester` / `defaultPointerCaptureSession` — same
naming convention.

### Composable extensions: `useGanttPointer`

Two new outputs and one new commit-payload field:

```ts
// New output: live projection during a bar-drag transaction.
readonly projectedRowId: ComputedRef<string | null>;

// BarDropPayload (existing interface) gains:
readonly oldRowId: string;
readonly newRowId: string; // === oldRowId when drop reverts
```

`projectedRowId` is `null` outside a bar-drag txn. During a bar-drag
txn, it's `defaultStripResolver.atY(originPx.y + deltaY, strips)`.

`commit`'s bar-drag branch (`commitDrag`) calls
`defaultStripResolver.atY` once and includes the result (falling
back to `originalRowId`) in the emitted payload. The composable
already takes `strips` as input; no new input needed.

### Adapter render: snap to target strip

In `<ChronixGantt>`'s body-render flatMap over `placedBars`, the
existing branch:

```ts
if (activeTxn.kind === 'bar-drag') {
  renderX = bar.x + activeTxn.deltaX;
  renderY = bar.y + activeTxn.deltaY;
}
```

becomes:

```ts
if (activeTxn.kind === 'bar-drag') {
  renderX = bar.x + activeTxn.deltaX;
  const projectedRowId = pointer.projectedRowId.value;
  if (projectedRowId !== null && projectedRowId !== sourceBar.rowId) {
    // Snap to target strip; preserve intra-strip offset.
    const sourceStrip = stripById.get(sourceBar.rowId);
    const targetStrip = stripById.get(projectedRowId);
    if (sourceStrip && targetStrip) {
      const intraStripOffset = bar.y - sourceStrip.y;
      renderY = targetStrip.y + intraStripOffset;
    } else {
      renderY = bar.y + activeTxn.deltaY; // graceful fallback
    }
  } else {
    renderY = bar.y + activeTxn.deltaY; // same row → free Y
  }
}
```

`stripById` is a new lookup the setup function builds from
`strips.value`. Implemented as a computed map keyed by `rowId`.

### Demo wiring

`App.vue`'s `onBarDrop` already updates the bar's `range`. Add
two lines to update `rowId`:

```ts
function onBarDrop(p: BarDropPayload): void {
  const idx = bars.value.findIndex((b) => b.id === p.barId);
  if (idx >= 0) {
    const existing = bars.value[idx]!;
    bars.value = [
      ...bars.value.slice(0, idx),
      { ...existing, range: p.newRange, rowId: p.newRowId },
      ...bars.value.slice(idx + 1),
    ];
  }
  pushEvent(
    'bar-drop',
    `${p.barId}: ${fmtRange(p.oldRange)} → ${fmtRange(p.newRange)}` +
      (p.newRowId !== p.oldRowId ? ` [${p.oldRowId} → ${p.newRowId}]` : ''),
  );
}
```

The detail line now reads `bar-1: 01:00–05:00 → 03:00–07:00 [workshop-a → workshop-b]`
on a cross-row drop, or omits the bracket when same-row.

## Test coverage

### Core tests — `swimlane-strip-at-y.test.ts` (+5)

1. Y inside first strip → returns first strip's rowId
2. Y inside last strip → returns last strip's rowId
3. Y exactly on strip boundary (`y === strip.y`) → returns the
   strip starting at y (closed-open interval lower-inclusive)
4. Y in inter-strip gap (when `rowSpacing > 0`) → returns `null`
5. Y above first strip / below last → `null`
6. Empty strips array → `null` (no scan)

(6 tests total, +6 core; core total 183 → 189.)

### Adapter tests — `use-gantt-pointer.test.ts` extensions (+3)

7. `projectedRowId` is `null` outside a bar-drag txn
8. During bar-drag, `projectedRowId` tracks `originPx.y + deltaY`
   through the configured strips
9. Cross-row commit emits `BarDropPayload` with `newRowId !==
oldRowId`; same-row commit emits payload with `newRowId ===
oldRowId`; out-of-strip drop emits payload with `newRowId
=== oldRowId` (revert)

### Adapter SFC tests — `chronix-gantt.test.ts` extensions (+3)

10. Mid-drag: simulate pointerdown on bar in r1, pointermove to
    a Y inside r2's strip → bar's rendered `y` equals
    `r2Strip.y + intraStripOffset` (snap).
11. On the same simulated drag, `pointerup` emits a `bar-drop`
    event with `newRowId: 'r2'`.
12. Drag outside all strips (Y below content) → renderY tracks
    deltaY (free), commit emits `newRowId === oldRowId`.

**Total new tests: 12.** core 183 → 189; vue3 124 → 130; chronix
total 307 → 319.

## VRT impact

None expected. VRT captures the initial render state (no drag in
flight); the new snap logic only fires when `activeTransaction` is
a bar-drag with `projectedRowId !== sourceRowId`. Existing 5
chronix VRT baselines should re-verify without changes. Will run
`chronix-verify` after each commit to confirm.

## Execution plan — 3 commits

### Commit 1: core `defaultStripResolver` + tests

- New file `packages/gantt/src/interaction/swimlane-strip-at-y.ts`
  with `SwimlaneStripResolver` interface + `defaultStripResolver`
  export.
- Export from `packages/gantt/src/interaction/index.ts` and
  `packages/gantt/src/index.ts`.
- New test file `packages/gantt/src/interaction/swimlane-strip-at-y.test.ts`
  with 6 cases.
- ci-check green → commit.

### Commit 2: composable extensions + BarDropPayload fields

- `use-gantt-pointer.ts`: add `projectedRowId` computed, augment
  `BarDropPayload` interface with `oldRowId` + `newRowId`,
  extend `commitDrag` to resolve via `defaultStripResolver.atY`
  with originalRowId fallback. **No adapter render changes
  yet** — visual still tracks free deltaY.
- The composable already reads `strips`; no new input.
- The `barRanges` lookup gives `originalRange` — also extend
  the adapter's `barRanges` input wiring with a parallel
  `barRowIds: ReadonlyMap<string, string>` so the composable
  knows each bar's source row at commit time. Built in setup
  from `props.bars`.
- 3 new tests in `use-gantt-pointer.test.ts`.
- 1 demo wiring change in App.vue: `onBarDrop` writes `rowId: p.newRowId`.
- Browser-verify: drag bar-1 down into workshop-b's row; on drop,
  bar visibly moves to workshop-b. Confirm the demo's event log
  shows the row transition in brackets.
- ci-check green → commit.

### Commit 3: adapter snap-render + SFC tests

- `chronix-gantt.ts`: build `stripById` computed map; in the
  bar-drag render branch, compute `renderY` from target strip
  - intra-strip offset when `projectedRowId` is a different row.
    Fall back to free `deltaY` for same-row or null-projection
    cases.
- 3 new SFC tests in `chronix-gantt.test.ts` covering the snap
  geometry + commit payload + free-fall outside strips.
- Browser-verify: during drag, bar visibly "snaps" to the target
  strip's vertical position as the pointer crosses the strip
  boundary. Subjective UX check: feels responsive and discrete,
  not jittery.
- ci-check green → commit.

### Commit 4 (wrap-up): journal + design-doc status

- `audit/journal/2026-05-13.md` adds a `## Phase 9` section.
- This doc's Status → DONE with commit shas.
- Memory `project_gantt_rewrite_plan.md` updated: test count
  307 → 319, Phase 9 added.

## Estimated scope

- Design doc: ~1.5 hours (this commit, separate)
- Commit 1 (core resolver + 6 tests): ~1 hour
- Commit 2 (composable + payload + demo wiring + 3 tests): ~2 hours
- Commit 3 (adapter snap-render + 3 SFC tests + browser verify): ~2 hours
- Commit 4 (docs): ~30 min
- **Total: ~7 hours focused work** across 1 session.

## Open questions for the user

1. **Approve resolving rowId in the composable layer rather than
   adding `projectedRowId` to `BarDragTransaction`?** Recommended
   — keeps the IR transaction layer DOM-free + layout-free, and
   the composable already has strips in scope. Catalog item 10
   parks the alternative explicitly.

2. **Approve "free Y during same-row, snap-Y during cross-row"
   for live preview?** Alternative: always snap to nearest strip
   even within a row (jumpy when the user is dragging horizontally).
   Or: always free (no snap, the bar can hover between rows).
   Recommended: free same-row + snap cross-row — matches the
   reference's mirror behavior.

3. **Confirm "intra-strip offset preserved on snap"?**
   Alternative: bar always lands at `targetStrip.y + barVerticalPadding`
   (top-aligned). For uniform-height strips this is the same.
   For variable-height strips it matters — e.g. dragging from a
   tall stacked row into a short row. Preserving the offset can
   produce a bar that overflows the target strip's bottom edge
   visually mid-drag (it lands correctly on commit because
   `BarPlacementPass` re-derives). Recommended: preserve offset
   for parity with k-ui's mirror.

4. **Approve falling back to source rowId on out-of-strip drop?**
   Alternative: snap to nearest strip even when y is outside.
   Recommended: revert — matches k-ui's "no valid hit" behavior
   and gives the user a clear escape gesture (drag bar back to
   somewhere off-strip to cancel the row change).

5. **Confirm `BarDropPayload.newRowId` is always non-undefined
   (= `oldRowId` when revert)?** Alternative: optional field
   `newRowId?: string` (present only when row changed).
   Recommended: always present — simpler for consumers who write
   back `bar.rowId = p.newRowId` unconditionally.

6. **Confirm we don't add per-bar `editable: false` or
   per-row `droppable: false` flags in v0?** chronix `BarSpec`
   and `RowSpec` don't have these today. Adding them is a small
   IR extension but creates a public-API commitment. Recommended:
   defer — `<ChronixGantt editable={false}>` covers the "no drag
   anywhere" case, and per-bar / per-row gating is a v1 feature.

7. **Confirm we don't add cross-row drag VRT baselines in v0?**
   VRT captures static initial state; a "mid-drag snap" baseline
   would require Playwright to simulate the drag and capture the
   mid-flight DOM. That's a bigger Playwright change. Recommended:
   defer; the SFC tests cover the geometry directly.

Reply **"按照推荐继续"** to accept all defaults (catalog
dispositions, composable-layer resolver, free-Y-same-row +
snap-Y-cross-row, intra-strip offset preserved, revert on
out-of-strip, `newRowId` always present, no per-bar/row gating,
no new VRT baselines).
