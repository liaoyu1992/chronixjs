# Phase 19 — Validation callbacks (`eventAllow` / `selectAllow` / `eventOverlap` / `eventConstraint`)

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

`audit/PARITY_RECHECK.md` Batch 5 §12 — Validation callbacks: 0/7
covered, classified **P0**. Every bar drag / resize / range-select
in chronix today commits unconditionally; there is no veto pathway.
A host who wants to forbid a drop into a forbidden zone, prevent
two bars from overlapping on the same row, or restrict a drag's
destination to a constrained time window has to manually un-do the
mutation after the fact — too late for the rendered UI (the bar
already moved).

This phase adds 4 of the 7 validation surface items — the named P0
cluster from PARITY_RECHECK's "Highest-impact parity gaps" §12:

- `eventAllow(span, movingBar): boolean` — drag/resize commit gate
- `selectAllow(span): boolean` — range-select commit gate
- `eventOverlap: boolean | (stillBar, movingBar) => boolean` —
  prevent overlap with other bars
- `eventConstraint: { range, rowIds? }` — restrict drag/resize
  destination to a time window + optional row whitelist

The remaining 3 items (per-bar overrides, `selectOverlap`,
`selectConstraint`, `businessHours`-style string shortcuts) are
PARKED — documented in the catalog with disposition.

**Reference**: the canonical validator at
`packages/gantt/src/validation.ts:81-256` (`isInteractionPropsValid`)
runs constraint → overlap → allow in that order. Each predicate has
a short-circuit: any single failure returns false. The same trio
runs for date-selection commits at lines 261-325
(`isDateSelectionPropsValid`). Constraint expansion is handled by
`allConstraintsPass` (lines 330-349).

## Reference (k-ui) behavior surface — full catalog

| Item                                                                                          | k-ui                                                                                                                            | chronix v0                                                                                                                            | Reason                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventAllow: (span, movingEvent) => boolean`                                                  | `validation.ts:230-252` runs after constraint + overlap; subject's `subjectConfig.allows` array iterated                        | ✅ port — `eventAllow?: (span, movingBar) => boolean` on `<ChronixGantt>`; payload `{ range, rowId }` + `BarSpec`                     | direct semantic match; chronix uses `BarSpec` + `TimeRange` instead of `EventApi` + `DateSpanApi`                                                                                                                 |
| `selectAllow: (span, null) => boolean`                                                        | `validation.ts:316-322` similar shape; movingEvent always null                                                                  | ✅ port — `selectAllow?: (span) => boolean` (no `null` second param; chronix's signature only takes the span)                        | drop the always-null param for a cleaner chronix-native surface; host can recover the polymorphic form by ignoring the missing arg                                                                                |
| `eventOverlap: boolean \| (stillEvent, movingEvent) => boolean`                               | `validation.ts:164-223`; default true; function called per overlapping pair                                                     | ✅ port — `eventOverlap?: boolean \| (stillBar, movingBar) => boolean`; default true                                                  | same polymorphism, chronix-native param types (`BarSpec`)                                                                                                                                                          |
| Same-resource-row overlap shortcut (k-ui allows overlap when stacking handles it)             | `validation.ts:174-201` — `isSameResourceRow` skips overlap check entirely; the resource-stacking system handles visual overlap | ✅ port — chronix's `BarStackHeightPass` stacks same-row bars vertically already, so same-row overlap is layout-OK; skip the check    | matches the reference's intent: overlap rejection targets cross-row collisions, not same-row stacking                                                                                                              |
| `eventConstraint: ConstraintInput`                                                            | `validation.ts:157-162` + `allConstraintsPass:330-349`; ConstraintInput = `'businessHours' \| string (groupId) \| EventInput`   | ✅ port (subset) — `eventConstraint?: { readonly range: TimeRange; readonly rowIds?: readonly string[] }`; object shape only          | the most common case is "this bar must stay within range R and (optionally) on row in set S"; string shortcuts ('businessHours' / groupId) parked                                                                  |
| Constraint string `'businessHours'`                                                           | `validation.ts:358-360` expands businessHours event-store to ranges                                                             | ⏸️ parked — chronix has no `businessHours` (Batch 5 §10, separate phase)                                                              | strictly depends on Phase TBD `businessHours` infrastructure                                                                                                                                                       |
| Constraint string (groupId)                                                                   | `validation.ts:362-364` filters event store by groupId                                                                          | ⏸️ parked — chronix's `BarSpec` has no `groupId` field; would expand the IR                                                           | the `{ range, rowIds }` object shape covers the explicit cases; groupId indirection is a v1+ concern                                                                                                               |
| Constraint as EventInput (recurring event)                                                    | `validation.ts:367-369` + `expandRecurring`                                                                                     | ⏸️ parked — chronix has no recurring events (Batch 5 §4)                                                                              | depends on recurring event support                                                                                                                                                                                 |
| Per-event `editable` / `startEditable` / `durationEditable` flags                             | `EventDef` carries per-event editability                                                                                        | ⏸️ parked — chronix has component-level `<ChronixGantt editable={false}>` only                                                        | per-bar gate is a separate phase; component-level toggle covers the demo                                                                                                                                           |
| Per-bar `BarSpec.overlap?` / `BarSpec.constraint?` overrides                                  | `eventDef.overlap` / `eventDef.constraint` examined in subject + other configs                                                  | ⏸️ parked — only component-level props in v0                                                                                          | additive surface; revisit when a demo or user wires per-bar rules                                                                                                                                                  |
| `selectOverlap` + `selectConstraint`                                                          | `validation.ts:280-312` mirrors `eventOverlap` + `eventConstraint` for range-select                                             | ⏸️ parked v0 — `selectAllow` is the only select-side validator in this phase                                                          | each adds two more props with overlapping conceptual surface; ship the most-requested 4 first, fill the remaining 2 in Phase 19.x if demand surfaces                                                               |
| Live validation during hitupdate (cursor color + mirror tint change)                          | `EventDragging.ts` runs `isInteractionValid` on every hitupdate; sets `interaction.isValid` → mirror styles + cursor reflect    | ⏸️ parked — chronix runs validators at commit-time only; mid-drag rendering doesn't reflect validity                                  | live cue requires: (1) routing validity result into the active-transaction render path; (2) bar-color / stroke variant; (3) cursor change. Each is non-trivial. v0 ships silent commit-time gate; v1 adds live cue |
| Range-pre-trim via `dateProfile.validRange` (rangeContainsRange)                              | `validation.ts:26-29, 38-40` checks the proposed range lies inside the view's valid range                                       | ❌ rejected v0 — chronix's view range is `anchorDate`-driven, no separate `validRange`                                                | not blocking; the host's `eventAllow` / `eventConstraint` can carry the same intent if needed                                                                                                                      |
| Commit-time validation gate (no host-side undo needed)                                        | k-ui's `EventDragging`/`EventResizing`/`DateSelecting` reducers reject the mutation entirely if `isPropsValid` returns false    | ✅ port — chronix `useGanttPointer`'s `commitDrag`/`commitResize`/`commitSelect` consult validators; on false, skip the `onBar*` emit | core semantic. Chronix adds explicit `*-rejected` emits so the host can surface "drop rejected because overlap" toasts                                                                                              |
| Rejection visible to host                                                                     | k-ui silently reverts (mutation not applied); no separate "rejected" event                                                      | ✅ port + chronix-extra — chronix silently reverts AND emits `bar-drop-rejected` / `bar-resize-rejected` / `select-rejected`         | the silent revert matches k-ui; the explicit emit lets hosts show feedback without polling                                                                                                                         |
| Apply to which transactions: bar-drag + bar-resize + range-select                             | k-ui validates all 3 (the `eventDrag` HACK comment at validation.ts:30 + `dateSelection` branch)                                | ✅ port — `eventAllow` + `eventOverlap` + `eventConstraint` apply to drag + resize; `selectAllow` applies to range-select             | symmetric with k-ui                                                                                                                                                                                                |
| Progress-handle exempted                                                                      | k-ui does NOT validate progress changes (it's not a date-mutation)                                                              | ✅ port — `commitProgress` skips all validators                                                                                       | progress change doesn't move the bar; validating it would block legitimate progress edits                                                                                                                          |
| Predicate evaluation order: constraint → overlap → allow                                      | `validation.ts:157-252` runs in this order; first failure short-circuits                                                        | ✅ port — same order, same short-circuit                                                                                              | deterministic; matches reference                                                                                                                                                                                   |

## Approach

### New public types (in `packages/gantt/src/api/validation.ts`)

```ts
import type { BarSpec } from '../ir/index.js';
import type { TimeRange } from '../ir/primitives.js';

/**
 * The proposed post-commit state being validated. `range` is the
 * new time range (start, end) and `rowId` is the target row.
 * Both already have snap-to-grid applied (by the time the validator
 * runs, the resolved range is final).
 */
export interface DropProposal {
  readonly range: TimeRange;
  readonly rowId: string;
}

/**
 * `eventAllow` predicate. Returns `true` to permit the commit;
 * `false` aborts the commit (silent revert + rejected emit).
 * `movingBar` is the bar being dragged or resized.
 */
export type EventAllowFunc = (proposal: DropProposal, movingBar: BarSpec) => boolean;

/**
 * `selectAllow` predicate for calendar-range-select commits. Same
 * shape as `EventAllowFunc` minus the moving-bar (range-select
 * creates a new range, not mutates an existing bar).
 */
export type SelectAllowFunc = (proposal: DropProposal) => boolean;

/**
 * `eventOverlap` predicate variant. Called per pair of (stillBar,
 * movingBar) that have intersecting ranges on DIFFERENT rows
 * (same-row overlap is allowed by default since `BarStackHeightPass`
 * stacks them vertically — matches the reference's same-resource
 * shortcut). Returns `false` to reject.
 */
export type EventOverlapFunc = (stillBar: BarSpec, movingBar: BarSpec) => boolean;

/**
 * Constrains drag/resize destinations to a time window + optional
 * row whitelist. The proposed range must satisfy:
 *   - `proposal.range.start >= constraint.range.start`
 *   - `proposal.range.end <= constraint.range.end`
 *   - if `constraint.rowIds` is set: `proposal.rowId ∈ constraint.rowIds`
 */
export interface EventConstraint {
  readonly range: TimeRange;
  readonly rowIds?: readonly string[];
}

/** Why a commit was rejected. Surfaced on `*-rejected` emit payloads. */
export type RejectionReason = 'constraint' | 'overlap' | 'allow';

export interface ValidationContext {
  readonly bars: readonly BarSpec[];
  readonly eventAllow?: EventAllowFunc;
  readonly selectAllow?: SelectAllowFunc;
  readonly eventOverlap?: boolean | EventOverlapFunc;
  readonly eventConstraint?: EventConstraint;
}
```

### Pure validators

```ts
/**
 * Result of a validation pass: pass (`null`) or first-failing
 * reason. Order: constraint → overlap → allow, matching the
 * reference's short-circuit sequence.
 */
export function validateDrop(
  proposal: DropProposal,
  movingBar: BarSpec,
  ctx: ValidationContext,
): RejectionReason | null {
  if (ctx.eventConstraint && !satisfiesConstraint(proposal, ctx.eventConstraint)) {
    return 'constraint';
  }
  if (!satisfiesOverlap(proposal, movingBar, ctx)) {
    return 'overlap';
  }
  if (ctx.eventAllow && !ctx.eventAllow(proposal, movingBar)) {
    return 'allow';
  }
  return null;
}

/** Same trio for resize (algorithmically identical — only the caller differs). */
export const validateResize = validateDrop;

/**
 * Range-select validation. Only constraint + allow apply
 * (`selectOverlap` is parked v0).
 */
export function validateSelect(
  proposal: DropProposal,
  ctx: ValidationContext,
): RejectionReason | null {
  if (ctx.eventConstraint && !satisfiesConstraint(proposal, ctx.eventConstraint)) {
    return 'constraint';
  }
  if (ctx.selectAllow && !ctx.selectAllow(proposal)) {
    return 'allow';
  }
  return null;
}

function satisfiesConstraint(proposal: DropProposal, c: EventConstraint): boolean {
  if (proposal.range.start.getTime() < c.range.start.getTime()) return false;
  if (proposal.range.end.getTime() > c.range.end.getTime()) return false;
  if (c.rowIds && !c.rowIds.includes(proposal.rowId)) return false;
  return true;
}

function satisfiesOverlap(
  proposal: DropProposal,
  movingBar: BarSpec,
  ctx: ValidationContext,
): boolean {
  if (ctx.eventOverlap === true || ctx.eventOverlap === undefined) return true;
  const overlapFunc = typeof ctx.eventOverlap === 'function' ? ctx.eventOverlap : null;
  for (const stillBar of ctx.bars) {
    if (stillBar.id === movingBar.id) continue;
    // Same-row overlap is allowed (BarStackHeightPass handles it).
    if (stillBar.rowId === proposal.rowId) continue;
    if (!rangesIntersect(proposal.range, stillBar.range)) continue;
    // Cross-row overlap with intersecting ranges. Apply policy.
    if (ctx.eventOverlap === false) return false;
    if (overlapFunc && !overlapFunc(stillBar, movingBar)) return false;
  }
  return true;
}

function rangesIntersect(a: TimeRange, b: TimeRange): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}
```

### Adapter wiring (`adapters/vue3/src/use-gantt-pointer.ts`)

`UseGanttPointerInput` gains 4 reactive validator inputs:

```ts
readonly eventAllow?: MaybeRefOrGetter<EventAllowFunc | undefined>;
readonly selectAllow?: MaybeRefOrGetter<SelectAllowFunc | undefined>;
readonly eventOverlap?: MaybeRefOrGetter<boolean | EventOverlapFunc | undefined>;
readonly eventConstraint?: MaybeRefOrGetter<EventConstraint | undefined>;
readonly bars: MaybeRefOrGetter<readonly BarSpec[]>;
readonly onBarDropRejected?: (payload: BarDropRejectedPayload) => void;
readonly onBarResizeRejected?: (payload: BarResizeRejectedPayload) => void;
readonly onSelectRejected?: (payload: SelectRejectedPayload) => void;
```

`commitDrag` becomes:

```ts
function commitDrag(txn: BarDragTransaction, snapDurationMs: number | undefined): void {
  const barRanges = toValue(input.barRanges);
  const originalRange = barRanges.get(txn.barId);
  if (!originalRange) return;
  const out = defaultPointerCaptureSession.commitBarDrag({ ... });
  const barRowIds = toValue(input.barRowIds);
  const oldRowId = barRowIds?.get(txn.barId) ?? '';
  const dropY = txn.originPx.y + txn.deltaY;
  const resolvedRowId = defaultStripResolver.atY(dropY, toValue(input.strips));
  const newRowId = resolvedRowId ?? oldRowId;

  // Phase 19: validation gate
  const bars = toValue(input.bars);
  const movingBar = bars.find((b) => b.id === txn.barId);
  if (movingBar) {
    const proposal: DropProposal = { range: out.resolvedRange, rowId: newRowId };
    const reason = validateDrop(proposal, movingBar, {
      bars,
      eventAllow: toValue(input.eventAllow),
      eventOverlap: toValue(input.eventOverlap),
      eventConstraint: toValue(input.eventConstraint),
    });
    if (reason !== null) {
      input.onBarDropRejected?.({
        barId: txn.barId,
        oldRange: originalRange,
        attemptedRange: out.resolvedRange,
        oldRowId,
        attemptedRowId: newRowId,
        reason,
      });
      return; // silent revert — onBarDrop NOT called
    }
  }

  input.onBarDrop?.({ barId: txn.barId, oldRange: originalRange, newRange: out.resolvedRange, oldRowId, newRowId });
}
```

Symmetric changes for `commitResize` and `commitSelect`.
`commitProgress` is untouched.

### `<ChronixGantt>` props + emits

Props added:

```ts
eventAllow: { type: Function as PropType<EventAllowFunc | undefined>, default: undefined },
selectAllow: { type: Function as PropType<SelectAllowFunc | undefined>, default: undefined },
eventOverlap: { type: [Boolean, Function] as PropType<boolean | EventOverlapFunc | undefined>, default: undefined },
eventConstraint: { type: Object as PropType<EventConstraint | undefined>, default: undefined },
```

Emits added:

```ts
'bar-drop-rejected': (_payload: BarDropRejectedPayload) => true,
'bar-resize-rejected': (_payload: BarResizeRejectedPayload) => true,
'select-rejected': (_payload: SelectRejectedPayload) => true,
```

Threaded into `useGanttPointer` via `props.eventAllow` etc.

### Demo wiring

`examples/gantt-vue3/src/App.vue` adds 4 sample callback predicates
under a "Validation demo" section, with toggleable checkboxes:

- `eventOverlap: false` — prevents cross-row overlap
- `eventConstraint: { range: today..today+7d, rowIds: ['workshop-a', ...] }` — first 3 rows only, today's week
- `eventAllow: (span, bar) => span.range.start.getHours() >= 8` — only after 8am
- `selectAllow: (span) => span.range.end.getTime() - span.range.start.getTime() <= 4hours` — max 4 hours

Three new event-log entries (`bar-drop-rejected` / `bar-resize-rejected` / `select-rejected`)
show the rejection in the demo's event panel.

### Alternative approaches considered

1. **Live validation during hitupdate (k-ui-exact)**. Would mirror
   the reference's `isValid` flag on the in-flight transaction,
   color the bar red, change the cursor, etc. Rejected for v0
   because: (a) chronix has no "mirror element" — bars render
   in-place during drag, so a "color overlay" is a separate render
   layer; (b) the validation function may be expensive (host code),
   and running it per pointermove without throttle is a perf cliff;
   (c) silent commit-time gate + explicit `*-rejected` emit gives
   the host enough information to show a toast / undo dialog, which
   is the actually-useful UX in most apps. v1 adds live cue as
   additive opt-in.

2. **Per-bar overrides (`BarSpec.overlap?` / `BarSpec.constraint?`)**.
   K-ui supports per-event config. Rejected for v0 because the
   demo doesn't exercise it and it doubles the validation
   complexity (per-bar config must be merged with component-level
   props, and the "still-event"'s overlap config also applies in
   k-ui's `validation.ts:206-208`). v1 adds when a host requests it.

3. **Validate inside `defaultPointerCaptureSession.commitBarDrag`
   (core, not adapter)**. Would put validators into the
   `PointerCaptureSession` config. Rejected because the validators
   are user-supplied functions that operate on `BarSpec` (the IR's
   public type); the core session deals with `BarDragTransaction`
   (pixel-and-time) state. Keeping the gate in the adapter
   preserves the core's "pure pixel-and-time math" purity. The
   pure helper in `packages/gantt/src/api/validation.ts` is the
   compromise: core-package types but adapter-package execution.

4. **One unified `onBarMutation: (proposal, kind) => boolean`**
   instead of 3 separate callbacks. Cleaner surface but loses the
   parity with k-ui's named callbacks and the host can't wire
   different policies per gesture kind easily. Rejected.

5. **Throw `RejectedError` instead of emitting**. Rejected — exceptions
   in pointer handlers cause Vue dev-warning noise and don't fit
   the existing `*Payload` emit pattern.

## Parity assertion plan — MANDATORY

The chronix VALIDATION behavior diverges from k-ui in 1 visible
way: the reference renders a live "invalid drag" cue (red
bar / cursor); chronix v0 commits silently and reverts on
rejection. The UNDERLYING algorithm (constraint → overlap →
allow short-circuit, same-row overlap allowed, k-ui-exact
predicate signatures) IS shared, but the rendered DOM behavior
during the drag differs.

**chronix-new — no parity assertion possible.** Rationale:
the v0 surface is silent commit-time-only. Driving the
reference demo via Playwright and asserting "k-ui also rejects
this drag" requires the reference demo to wire matching
validator predicates — which would require editing the
reference demo (R2 read-only discipline) OR programmatically
mutating the reference's option object via its imperative API
(too fragile for a parity assertion). The reference demo's
existing wiring is `eventOverlap: true` (allow all) — no
rejection behavior to observe.

The algorithm equivalence is enforced by unit tests in
`packages/gantt/src/api/validation.test.ts` (≥10 tests
covering constraint pass/fail, overlap with boolean / function
/ same-row-allow / cross-row-reject, allow pass/fail,
short-circuit order, select-side variants). Each test case
embeds the reference's expected behavior as a comment so
future drift is auditable against the spec. v1 phase will add
a live-cue parity assertion once the visual cue lands.

## Test coverage

- core: `packages/gantt/src/api/validation.test.ts` (+12 tests):
  - constraint: pass when range inside window
  - constraint: fail when range starts before window
  - constraint: fail when range ends after window
  - constraint: rowIds whitelist pass
  - constraint: rowIds whitelist fail
  - overlap default (undefined): allow
  - overlap = true: allow
  - overlap = false: reject cross-row intersect
  - overlap = false: allow same-row intersect (BarStackHeightPass handles it)
  - overlap = function: respect return value
  - allow: pass when function returns true
  - allow: reject when function returns false
  - short-circuit order: constraint failure beats overlap failure beats allow failure
- adapter: `adapters/vue3/src/chronix-gantt.test.ts` (+6 tests):
  - bar-drag rejected by overlap → `onBarDrop` NOT called, `onBarDropRejected` called with reason `'overlap'`
  - bar-resize rejected by constraint → `onBarResize` NOT called, `onBarResizeRejected` called with reason `'constraint'`
  - range-select rejected by `selectAllow` → `onSelect` NOT called, `onSelectRejected` called with reason `'allow'`
  - all 4 props omitted → no rejection path, existing behavior preserved (regression guard)
  - `eventOverlap: true` (explicit) → no rejection
  - progress-handle never validates → unaffected by `eventConstraint`
- parity: none (chronix-new declared)
- demo: manually browser-verify via the 4 toggleable validators in the chronix demo

## VRT impact

**None expected**. The visible default state of the chronix demo is
unchanged — the validation toggles ship as opt-in checkboxes
defaulting to OFF, so the base render is byte-for-byte identical.
If the user wants VRT coverage of "rejected drag visual cue" that's
a follow-up phase once a live cue exists.

## Execution plan — 1 commit + wrap-up

### Commit 1: `feat(gantt): commit-time validation callbacks (Phase 19)`

- `packages/gantt/src/api/validation.ts` (new): public types
  (`DropProposal`, `EventAllowFunc`, `SelectAllowFunc`,
  `EventOverlapFunc`, `EventConstraint`, `RejectionReason`,
  `ValidationContext`) + pure validators (`validateDrop`,
  `validateResize`, `validateSelect`).
- `packages/gantt/src/api/validation.test.ts` (new): 12 unit tests.
- `packages/gantt/src/index.ts`: re-export the new types + functions.
- `adapters/vue3/src/use-gantt-pointer.ts`: 4 new inputs +
  `onBar*Rejected` callbacks; `commitDrag` / `commitResize` /
  `commitSelect` consult validators.
- `adapters/vue3/src/chronix-gantt.ts`: 4 new props + 3 new emits;
  thread to `useGanttPointer`.
- `adapters/vue3/src/index.ts`: re-export rejection payload types.
- `adapters/vue3/src/chronix-gantt.test.ts`: +6 SFC tests.
- `examples/gantt-vue3/src/App.vue`: 4 sample validators + toggle
  checkboxes + 3 new event-log entries.
- `examples/gantt-vue3/src/styles.css`: minor toolbar styling for
  the new toggle group.
- **Browser verify**: chronix demo at 8702, toggle each validator
  on, attempt a drag/resize/select that should be rejected, confirm
  bar reverts + event log shows `*-rejected` entry. Toggle off,
  confirm gesture commits normally.
- **Anti-regression**: existing 24 parity assertions + 381 vitest
  + 5 VRT baselines stay green (no behavior change when validator
  props are undefined).

### Commit 2 (wrap-up — REQUIRES `/phase-close` invocation)

- `audit/journal/2026-05-13.md`: "Phase 19" section with all 6
  required sub-sections.
- Memory `project_gantt_rewrite_plan.md` description: bump
  Phase 18 → Phase 19 + test count 381 → 399 (+12 core +6 SFC).
- Memory `MEMORY.md` index line: same bump.
- This doc's Status → DONE with commit shas.
- Invoke `/phase-close` skill BEFORE flipping Status.

## Estimated scope

- core validation.ts: ~120 LOC (~1 hour)
- core validation.test.ts: ~250 LOC, 12 tests (~1 hour)
- adapter useGanttPointer changes: ~80 LOC (~30 min)
- adapter SFC tests: ~150 LOC, 6 tests (~1 hour)
- ChronixGantt prop + emit additions: ~50 LOC (~15 min)
- Demo wiring: ~80 LOC (~30 min)
- Browser verify + bug-fix loop: ~45 min
- Wrap-up + `/phase-close`: ~30 min
- **Total: ~5.5–6 hours focused work, ~700 LOC.**

## Open questions for the user

1. **Approve commit-time-only validation (parking the live cue)?**
   K-ui validates per-hitupdate; chronix v0 validates at commit
   only. Trade-off: simpler implementation + cleaner perf at the
   cost of "drag visually completes then snaps back". Recommended:
   yes — silent revert + explicit `*-rejected` emits cover the
   90% UX case.

2. **Approve `eventConstraint` as object-only `{ range, rowIds? }`?**
   K-ui supports `'businessHours' | groupId | EventInput` shapes.
   Chronix v0 drops the string + recurring-event shortcuts. Object
   shape covers the core use case ("stay within window R on rows
   S"). Recommended: yes — string shortcuts depend on parked
   infrastructure (businessHours, groupId field).

3. **Approve same-row overlap ALLOWED by default** (cross-row
   overlap respects the flag)? Matches k-ui's resource-stacking
   shortcut. Different default would diverge from `eventOverlap:
   false` semantics. Recommended: yes.

4. **Approve dropping `selectOverlap` + `selectConstraint` for v0**
   (only `selectAllow` covers range-select)? Both are additive;
   ship the most-requested 4 first. Recommended: yes —
   `selectAllow` is the chosen primary; the other 2 wait for
   demand.

5. **Approve dropping `null` second param from `selectAllow`**?
   K-ui's signature is `(span, null) => boolean` (always null for
   range-select). Chronix-native: `(span) => boolean`. Loses
   verbatim signature match but cleans up the surface. Recommended:
   yes.

6. **Approve emitting `*-rejected` events** (separate from existing
   `bar-drop` / `bar-resize` / `select`) on rejection? Alternative:
   add a `rejected: { reason }` field to existing emits. New
   emits are cleaner and match Vue idiom. Recommended: yes,
   separate emits.

7. **Approve parking per-bar overrides (`BarSpec.overlap?` /
   `BarSpec.constraint?`)**? Component-level props cover the demo
   and the named PARITY_RECHECK items. Recommended: yes.

8. **Approve demo wiring with 4 sample predicates + toggle
   checkboxes**? Gives end-to-end visibility without changing
   defaults. Recommended: yes.

9. **Approve declaring chronix-new for the parity assertion**?
   Rationale: silent commit-time gate vs k-ui's live hitupdate cue
   is a deliberate v0 simplification; algorithm equivalence
   verified via unit tests with predicates grounded in k-ui's
   `isInteractionPropsValid` rules. Recommended: yes.

10. **Approve single-commit implementation** (core + adapter +
    SFC tests + demo all in one commit) + 1 wrap-up commit per
    parity discipline? Recommended: yes.

Reply **按照推荐继续** to accept all defaults (commit-time only,
object-only constraint, same-row allowed, drop selectOverlap +
selectConstraint, drop null param from selectAllow, separate
`*-rejected` emits, park per-bar, demo wired, chronix-new parity
declaration, single-commit impl).
