# Phase 7 — Smooth LinkRouter (cubic Bézier routing)

**Status**: **Approved (2026-05-15)**. Forward-only scope; reference's empirical control-point formula matched verbatim; link rendering in `<ChronixGantt>` parked. Implementation starting.

## Problem

`LinkSpec.routing: 'square' | 'smooth'` has been part of the IR
since Phase 1; `defaultLinkRouter` implements `'square'` (3-segment
elbow) but throws `LinkRouter: routing 'smooth' not yet implemented`
for `'smooth'`. The reference demo has a `lineStyle:
ref<'square' | 'smooth'>('square')` toggle in `DemoApp.vue` — a
chronix consumer that flips a `LinkSpec.routing` to `'smooth'`
gets a runtime crash today.

This phase fills the parked path: implement smooth routing for the
common case (forward links, target to the right of source) and
explicitly park the rarer case (backward links, target to the
left).

## Reference algorithm

`packages/gantt/src/timeline/DependencyLineAlgorithm.ts:358–510`
implements `setSmoothPoints(line)`. Four branches based on the
relative source/target geometry:

| Branch | Same row? | Target          | Algorithm                                                              | Demo-evidenced?                                |
| ------ | --------- | --------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| 1      | yes       | right of source | Straight `L` line (performance optimization)                           | ✅ (any same-row forward link)                 |
| 2      | yes       | left of source  | Square detour with vertical clearance (NOT smooth)                     | ❌                                             |
| 3      | no        | right of source | Cubic Bézier `C` curve to `(toX - 20, toY)` + horizontal `L` to target | ✅ (cross-row forward links — the common case) |
| 4      | no        | left of source  | Compound `C` + `S` curve detour with horizontal `L` to target          | ❌                                             |

For branches 2 and 4, the reference handles backward links (which
violate the usual gantt dependency semantics of "X finishes before Y
starts"). chronix's demo data has no backward links — these branches
exist in the reference for circular/manual dependency overrides that
the chronix v0 demo doesn't exercise.

## Approach

### Scope: forward direction only (branches 1 + 3)

Implement smooth routing for `to.x >= from.x` cases. Backward links
throw `LinkRouter: 'smooth' routing for backward links not yet
implemented` — explicit failure rather than silent square-fallback,
matching the existing throw pattern for unimplemented routing.

This honors the drift-prevention discipline: parked items get an
explicit observation grounding the deferral.
"Reference demo doesn't exercise backward links" is the rationale —
the same evidentiary pattern Phase 5.x used for the 9 tree-grouping
leftovers.

### Path geometry (matching the reference)

For chronix's anchor pair (`from = predecessor right-edge mid`,
`to = successor left-edge mid`):

**Branch 1** — `from.y === to.y` (same row, forward):

```text
M from.x from.y L to.x to.y
```

A direct horizontal line. No Bézier needed; identical to what
`'square'` would produce for the degenerate case anyway, minus the
elbow nub.

**Branch 3** — `from.y !== to.y` (cross-row, forward):

```text
M from.x from.y
C midX from.y  beforeTargetX-10 to.y  beforeTargetX to.y
L to.x to.y
```

Where:

- `midX = (from.x + to.x) / 2` — horizontal mid-point (first control
  point's x)
- `beforeTargetX = to.x - beforeTargetGap` — pre-target landing point
  (default gap 20 px to match the reference)
- First control point at `(midX, from.y)` keeps the curve horizontal
  near the source.
- Second control point at `(beforeTargetX - 10, to.y)` makes the
  curve almost horizontal near the target.
- Endpoint at `(beforeTargetX, to.y)` exits the curve onto the same
  y as the target.
- Final `L` segment is a short horizontal line that enters the
  target's left edge cleanly (so the marker stays oriented at 0°).

The `-10` offset for the second control point and the `beforeTargetGap`
of 20 px are both empirically tuned in the reference; chronix matches
them verbatim so the visual shape of a smooth link is reference-
equivalent.

### Marker

Same as square routing: `angleDeg: 0` (marker points right) at the
target's left-edge mid. The final `L` segment is always horizontal,
so this stays correct.

### Configuration

`LinkRouterInput.elbowNubPx` is square-only. Add a sibling
`LinkRouterInput.smoothBeforeTargetGapPx?: number` (default 20) so
consumers can override the pre-target landing gap.

## Component API after Phase 7

`LinkRouterInput` (in `packages/gantt/src/layout/types.ts`) gains:

```ts
/** Px gap from the target's left edge to the smooth curve's
 * pre-landing point. The final straight `L` segment uses this length.
 * Default 20 — matches the reference's empirical value. */
readonly smoothBeforeTargetGapPx?: number;
```

`LinkSpec` and `RoutedLink` unchanged. `defaultLinkRouter` accepts
both routings; no breaking change for existing `'square'` callers.

## Test coverage

Replace the existing "throws on smooth routing" test with positive
assertions:

1. **Smooth, same row, forward** → emits `M fx fy L tx ty` (straight
   line; no `C`).
2. **Smooth, cross-row, forward** → emits the expected `M`+`C`+`L`
   path with the right control points + landing point.
3. **Smooth, custom `smoothBeforeTargetGapPx`** → landing point
   honors the override.
4. **Smooth, backward (target on left)** → still throws, but the
   error message specifies "backward" so future implementers know
   what's parked.
5. **Smooth, degenerate (from === to coordinates)** → emits a
   degenerate `M`+`L` to itself; doesn't throw.

Existing 12 link-router tests stay; new 4 tests bring total to 16.

## Execution plan — single commit

Test-only refactor + new code path. No demo changes (chronix's
demo has no links yet; link rendering in `<ChronixGantt>` is a
separate parked item). One commit:

### Commit 1: implement smooth routing + tests

- Add `smoothBeforeTargetGapPx?: number` to `LinkRouterInput`.
- Add `routeSmoothPath(from, to, gap)` private helper in
  `link-router.ts` returning the SVG path string.
- Replace the `else { throw ... }` branch with:
  - If `to.x < from.x` → throw the new "backward" message.
  - Else if `to.y === from.y` → emit straight `L`.
  - Else → emit `C`+`L` per branch 3 above.
- Update the test file: remove the old "throws on smooth" test,
  add the 4 new tests + 1 backward-throws regression.
- ci-check green → commit + push → **DONE** (no browser verify
  needed; chronix doesn't render links yet).

Optional follow-up phases (NOT in scope here):

- Link rendering in `<ChronixGantt>` adapter (would require demo
  data extension + new SFC tests + VRT impact).
- Backward smooth routing (branches 2 + 4) when a demo exercises
  it.

## Estimated scope

- `LinkRouterInput` field: ~5 min
- `routeSmoothPath` implementation: ~30 min
- Test updates: ~1 hour
- ci-check + commit + push: ~30 min
- Journal + docs: ~30 min
- Total: ~2.5 hours focused work

## Open questions for the user

1. **Approve the forward-only scope?** Branches 2 + 4 (backward
   links) stay parked with stated reason.
2. **Approve matching the reference's empirical control-point
   formula verbatim?** (Alternative: pick simpler control points
   like `(fromX + (toX-fromX)/3, fromY)` and `(fromX + 2*(toX-fromX)/3, toY)`.
   Recommend matching the reference for visual parity.)
3. **Confirm we don't wire link rendering into the demo here?**
   Chronix's `<ChronixGantt>` doesn't render links at all today;
   adding link rendering is a separate phase. This phase is
   layout-only.

Reply **"go"** for default answers + start the single commit.
