# Phase 6 — Non-day-view bar-placement parity

**Status**: **Approved (2026-05-15)**. Single-commit scope; hard-assert failures; per-view test isolation. Implementation starting.

## Problem

`tooling/golden-runner/tests/parity.spec.ts` asserts chronix-vs-reference
bar-placement parity for **day view only** (one of six timeline scales).
The other five views — week, month, season, halfYear, year — have:

- ✅ Slot-width parity (chronix-derived px-per-slot vs reference DOM
  center-to-center spacing). 6 assertions, one per view.
- ✅ Header-row monthFmt + tick-label set-equality. Covers axis text.
- ❌ **No per-bar (x, y, width) parity.** This is the gap.

Day-view bar-placement parity is the toughest assertion in the suite —
it locks down chronix's full layout pipeline (axis range planner →
bar-stack-height → row-swimlane → bar-placement) against the
reference DOM rect-by-rect. Extending it to the other five views
locks the same pipeline against the SAME demo data but under wider
time ranges (where the bar-stack pass sees more events per row, slot
widths change, axis math at the edges shifts).

Closing this gap directly addresses the drift-prevention discipline:
silent layout drift in week+ views is exactly the failure mode the
memory `feedback_no_logic_drift_from_kui.md` exists to catch.

## Approach

### Reuse the day-view test body verbatim

The existing day-view test (lines 491–664 of `parity.spec.ts`) is
already view-parameterizable in shape — it:

1. Builds the demo's test-event set
2. Loads a view via toggle
3. Probes the reference's rendered row order
4. Runs the chronix layout pipeline against the view's axis input
5. Extracts DOM bar rects relative to the body wrapper
6. Compares per-event-id, asserting (Δx ≤ 1, Δy ≤ 1, Δw ≤ 1)

The view-specific knobs are: the toggle button label, the `viewId`
passed to `defaultAxisRangePlanner.plan(...)`, and the time-range
that determines how many events are within axis bounds. Everything
else (event data, layout constants, comparison logic, error
reporting) is shared.

Refactor approach: extract steps 2–6 into a helper
`runBarPlacementParity(page, viewId, viewToggleLabel)` and call it
from 6 tests (one per view). The current day-view test becomes a
single `runBarPlacementParity(page, 'day', '日')` call wrapped in
`test('day-view bar placement', ...)`.

### View-specific considerations

Each view has its own axis natural width and event-visibility profile:

| View     | Axis natural width (px) | Visible events (of 25 demo events)     |
| -------- | ----------------------- | -------------------------------------- |
| day      | 1440                    | ~13 (those intersecting today)         |
| week     | 8736                    | ~17 (those intersecting today's week)  |
| month    | ~2000                   | ~20 (those intersecting today's month) |
| season   | ~6000                   | ~25 (3-month range, covers all)        |
| halfYear | ~12000                  | 25 (6-month range, covers all)         |
| year     | ~24000                  | 25 (full event span fits)              |

Wider views = more events compared per test = tighter coverage of
the layout pipeline under varied stack-height pressure.

Comparison math is unchanged across views: `r.left - wrapperLeft`
on the reference side, `chronix.x` on the chronix side. Wrapper's
`scrollWidth` is the natural axis width even when the visible
viewport clips it — `getBoundingClientRect()` returns absolute page
coordinates, so off-screen bars still report their true x.

### Known sources of view-specific noise

- **Slot widths differ between views.** Already verified by existing
  slot-width parity tests; chronix's `deriveSlotWidth` is locked in.
  Bar widths derived from `bar.duration × pxPerMs` automatically
  follow.
- **Strip heights MAY differ between views.** `BarStackHeightPass`
  takes the axis range — events outside it don't contribute to row
  stack heights. Week view sees more events per row than day view,
  so some rows might be TALLER on week than on day. Both chronix
  and reference compute heights from the same event set + same axis,
  so they should agree.
- **Y origin offset.** The day-view test handles `wrapperRowOffsetY`
  (~0.5px between the wrapper top and the first strip top). The same
  offset applies to all views; the helper just probes it per-test.

### Out of scope (parked, with reason)

- **Cross-row bar Y assertion when bars migrate during recapture.**
  The reference doesn't reorder rows mid-test. Parked as N/A.
- **Bar-resize / bar-drag interactions per view.** Phase 3 covers
  recording-replay for drag math; visual placement parity is its own
  concern, this phase only.
- **Progress-handle position parity.** Phase 4's progress overlay
  renders the handle at `(barX + width × progress/100)`; chronix
  uses the same formula. No additional parity needed; covered by
  the bar-rect parity (handle position is derived).
- **Bars rendered as multi-segment (split across weekends)** — the
  reference's vue3 demo doesn't toggle weekend visibility off in
  any view, so this codepath isn't exercised.

## Execution plan — single commit (low scope, no UI change)

This phase is test-only. No component code changes, no demo changes,
no VRT impact. One commit:

### Commit 1: refactor + add 5 non-day parity tests

- Extract the day-view test body into a helper
  `async function runBarPlacementParity(page, viewId, viewToggleLabel)`
  returning `{ comparedCount, failures }`.
- Reduce the existing `'day-view bar placement'` test to a single call
  to the helper with assertions over its return value (keeps the
  existing test's contract intact).
- Add 5 new tests in the same describe block, one per view:
  - `'week-view bar placement (x + y + width per event-id)'`
  - `'month-view bar placement (...)'`
  - `'season-view bar placement (...)'`
  - `'half-year-view bar placement (...)'`
  - `'year-view bar placement (...)'`
- ci-check green → commit + push → **PAUSE for user to review the
  test counts**. (No browser verify needed; the parity tests run
  against the reference demo's actual rendering, and any failure
  prints `chronix=(...) dom=(...)` diffs to console.)

Optional follow-up commit if any parity fails: investigate + fix the
specific layout-pass bug exposed. Per the drift-prevention
discipline, finding a failure here is exactly the point — the diff
IS the parity gap.

## Estimated scope

- Helper extraction: ~30 min
- 5 new test definitions: ~30 min
- Running + verifying: ~30 min
- Journal + docs: ~30 min
- Total: ~2 hours focused work (assuming all 5 tests pass on first run)
- - variable hours if any parity gap surfaces and needs fixing

## Open questions for the user

1. **Approve the single-commit scope?** This phase is intentionally
   test-only. If a parity gap surfaces, the fix becomes a follow-up
   commit with its own scope review — keeps the diffs surveyable.
2. **Should failures be soft-asserted or hard-asserted?** The current
   day-view test hard-asserts (`expect(failures).toEqual([])`). I'll
   keep that pattern — surfacing a regression is the WHOLE point.
3. **What if one view's tests fail and the others pass?** Each view
   is its own `test(...)` block, so Playwright reports them
   independently. Failure isolation is automatic.

Reply **"go"** for default answers + start the single commit, or
adjust before I proceed.
