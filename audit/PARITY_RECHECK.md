# Parity Re-check (2026-05-15)

Comprehensive algorithm-by-algorithm parity audit ordered by the user
on 2026-05-15. Concern: rigor in early phases (Phase 4.4 / 6 ran
side-by-side k-ui-vs-chronix probes via `tooling/golden-runner/`) was
not maintained in later phases (Phase 7 through 16 added algorithm
code without parallel parity assertions), so drift may have
accumulated.

**Parity contract (R2 + L2)**:

- **Identifier names**: chronix is intentionally chronix-native; name
  divergence is REQUIRED, not drift. Banned-name scanner enforces.
- **Algorithm logic**: same observable outputs for same inputs IS
  required. Drift = where chronix's logic produces different outputs
  than k-ui's for inputs the demo exercises.
- **Visual output**: same DOM render at the SVG-pixel level for
  identical input states (held by `tooling/golden-runner/`'s
  chronix-visual.spec.ts; 5 baselines).
- **Behavioral output**: same emit sequences + timings + payload
  shapes (held by recording-replay parity tests).

**Verdict legend**:

- 🔴 **BLOCKING** — chronix produces different observable output than
  k-ui for an input the demo exercises. Must fix before parity is
  claimed.
- 🟡 **DIFFERS / NOTED** — chronix's algorithm produces a slightly
  different shape (e.g. different intermediate representation), but
  the final observable output matches for demo inputs. Document the
  choice OR flag a potential divergence beyond demo coverage.
- 🟢 **OK** — algorithm produces semantically identical outputs.
- ⏸️ **PARKED** — feature deliberately unimplemented in chronix v0;
  see the linked design doc for disposition.

## Drift inventory (already-implemented algorithms)

### Batch 1 — Axis algorithms

Chronix's axis layer reaches L2 parity for the demo's observable outputs (6 view buttons, zh-CN locale, weekends ON, viewport 1440px): all six slot-width parity tests pass to ±1px and the empirical tick-label set-equality tests pass for every view. The structural model however differs from k-ui in two important ways that are not currently policed by tests. (1) chronix collapses k-ui's two-level "slotDuration vs labelInterval" axis model into a single per-view slot — chronix.slotCount === k-ui.labelCount, and `slotDurationMs` reports the label interval, not k-ui's actual `slotDuration`. Downstream `pxPerMs = slotWidth/slotDurationMs` math is consistent on its own terms but is not a like-for-like port of k-ui's per-slot subdivision. (2) The `weekendsVisible` flag is plumbed through `AxisRangePlanInput` and documented as "When false, Saturday + Sunday slots are omitted from week-and-wider views" — but the planner never reads it; toggling weekends in a host app would not skip Sat/Sun like k-ui's `weekends: false → isHiddenDay → slotDates filter` does. The demo hard-codes `weekendsVisible: true`, so this gap is currently invisible. The remaining algorithms (anchorDate normalization, totalWidth, headerRows shape, locale label format, slot-width floor) are observable-equivalent to k-ui at the demo's input range, several with documented chronix-native simplifications cited in the audit journal.

| Algorithm                        | chronix file:lines                                                                                                                  | k-ui file:lines                                                                                                      | Verdict | Note                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. day-view tick generation      | `packages/gantt/src/layout/axis-range-planner.ts:80-113`                                                                            | `packages/gantt/src/timeline/timeline-date-profile.ts:160-169` + `resource-timeline/index.ts:20-23`                  | 🟡      | chronix emits 24 hourly ticks = k-ui's hourly LABELS, not k-ui's 48 30-min `slotDates`. Visually identical; `slotDurationMs` reports label interval.                                                                           |
| 2. week-view tick generation     | `axis-range-planner.ts:263-305`                                                                                                     | `timeline-date-profile.ts:160-169` + `resource-timeline/index.ts:24-27`                                              | 🟢      | 168 hourly ticks Mon-anchored; matches k-ui's labelCnt at demo locale. Parity test `week-view slot width` passes ±1px.                                                                                                         |
| 3. month-view tick generation    | `axis-range-planner.ts:145-189`                                                                                                     | `timeline-date-profile.ts:160-169` (slotDuration={days:1})                                                           | 🟢      | 28-31 day ticks; tick-label set-equality test green.                                                                                                                                                                           |
| 4. season-view tick generation   | `axis-range-planner.ts:200-261` (called w/ monthCount=3)                                                                            | `timeline-date-profile.ts:160-169` (duration={months:3})                                                             | 🟢      | 89-92 day ticks; set-equality test green.                                                                                                                                                                                      |
| 5. halfYear-view tick generation | `axis-range-planner.ts:200-261` (called w/ monthCount=6)                                                                            | same as #4 (duration={months:6})                                                                                     | 🟢      | 181-184 day ticks; floor=65px enforced; set-equality green.                                                                                                                                                                    |
| 6. year-view tick generation     | `axis-range-planner.ts:200-261` (called w/ monthCount=12, anchored Jan 1)                                                           | same (duration={years:1})                                                                                            | 🟢      | 365/366 day ticks; year-boundary anchor; set-equality green.                                                                                                                                                                   |
| 7. headerRows generation         | `axis-range-planner.ts:100-102, 187, 220-247, 285-294`                                                                              | `timeline-date-profile.ts:387-491` (`computeHeaderFormats`) + `530-581` (`buildCellRows`)                            | 🟡      | chronix day-view emits a single full-date header cell that k-ui's `hour`-unit branch (range≤1d) does not produce. Other views agree (1 super-row of N day/month cells). Documented in `audit/journal/2026-05-13.md` Phase 4.9. |
| 8. slot-width derivation         | `axis-range-planner.ts:46-55` (`deriveSlotWidth`)                                                                                   | `resource-timeline/GanttView.tsx:1979-2022` (`calculateActualSlotWidths`)                                            | 🟢      | `max(viewportWidth/slotCount, minChars×13)`; minChars=4 for day/week, 5 otherwise. All 6 slot-width parity tests green to ±1px.                                                                                                |
| 9. locale label formatting       | `axis-range-planner.ts:86-91, 155-162, 209-222, 271-276` (Intl.DateTimeFormat)                                                      | `datelib/formatting-native.ts:178` (Intl.DateTimeFormat under `createFormatter`)                                     | 🟢      | Both use Intl with the same option keys. Tick + header set-equality tests green across all 4 day-resolution views.                                                                                                             |
| 10. weekendsVisible flag         | `axis-range-planner.ts:1-333` (no occurrences) — declared at `layout/types.ts:62-64`                                                | `DateProfileGenerator.ts:380-410` (`initHiddenDays`) + `timeline-date-profile.ts:160-167` (filter via `isValidDate`) | 🔴      | chronix plumbs the flag but never reads it. k-ui's `weekends: false` skips Sat/Sun from `slotDates`. Demo hard-codes `true` so invisible in current parity. See drift details.                                                 |
| 11. anchorDate normalization     | `axis-range-planner.ts:60-78, 115-125` (local midnight via `setHours(0,0,0,0)`; Monday for week; `setMonth(0)+setDate(1)` for year) | `DateProfileGenerator.ts:246-292` (`buildRangeFromDuration` via `dateEnv.startOf(date, alignment)`)                  | 🟢      | Both resolve in local TZ. Week-view first-day = Monday on both.                                                                                                                                                                |
| 12. axis.totalWidth              | `axis-range-planner.ts:84, 178, 250, 269` (`slotCount × slotWidth`)                                                                 | `resource-timeline/GanttView.tsx:1969-1972` (`getEffectiveTimelineWidth = max(actualWidth, slotCount×minWidth)`)     | 🟢      | When slots are uniform, `slotCount × slotWidth == Σ slotWidths`.                                                                                                                                                               |
| 13. slotDurationMs derivation    | `axis-range-planner.ts:107, 183, 255, 299` (constants: `MS_PER_HOUR` for day/week, `MS_PER_DAY` for month/season/halfYear/year)     | `timeline-date-profile.ts:350-385` (`ensureSlotDuration`)                                                            | 🟡      | chronix reports k-ui's `labelInterval`, not k-ui's `slotDuration`. For day/week, k-ui auto-picks `{minutes:30}` slots under hourly labels. Downstream `pxPerMs` math compensates.                                              |

#### Drift details

##### 10. weekendsVisible flag (🔴 BLOCKING — but invisible in demo)

`AxisRangePlanInput.weekendsVisible` is documented at `layout/types.ts:62-64` as "When false, Saturday + Sunday slots are omitted from week-and-wider views." A `Grep` of `axis-range-planner.ts` (333 lines) returns zero matches for `weekends`, `weekend`, or `hidden`. The four call sites and the example (`examples/gantt-vue3/src/App.vue:80`) all pass `true`. k-ui's `DateProfileGenerator.initHiddenDays` reads `options.weekends === false` and pushes day-of-week 0 and 6 into `isHiddenDayHash`; `buildTimelineDateProfile` then drops those dates from `slotDates` via `isValidDate(...) → dateProfileGenerator.isHiddenDay(date)`. Net consequence: a host that toggles `weekendsVisible: false` on chronix while passing the same flag through to a k-ui-rendered axis would see chronix emit Mon-Sun slots (e.g. 184 slots for a half-year) while k-ui emits Mon-Fri only (~132 slots for a half-year). The slot widths, tick labels, header bands, and downstream bar placements would all diverge. The demo never toggles this flag, so neither vitest nor the Playwright parity suite catches it. **Recommendation**: implement the filter in `planMonthBandedAxis` + `planWeekView` (skip days where `cursor.getDay() === 0 || === 6` when `!weekendsVisible`) and recompute slot-width against filtered `slotCount`.

##### 7. headerRows generation (day view) (🟡)

Chronix's `planDayView` emits an extra header row containing a full-date label ("2026年5月13日") above the 24 hour ticks. k-ui's `hour`-unit branch suppresses this when range ≤ 1 day (range=24h on day view). Net: chronix's rendered axis has a date header bar that k-ui's does not. The week view picks up the same hour-unit branch but with range=7 days, so chronix's 7-day super-row matches k-ui. Currently un-asserted by parity tests.

##### 1 + 13. day-view tick + slotDurationMs (label-vs-slot model collapse) (🟡)

Chronix's `planDayView` produces `slotCount=24, slotDurationMs=MS_PER_HOUR`. k-ui's day view auto-picks `{ hours: 1 }` labels with `{ minutes: 30 }` slots (48 slot dates, 24 header-row cells). chronix collapses the two levels. Observable consequence at the demo: rendered hour LABEL centers are 60px apart in both stacks (slot-width parity test green); the rendered DOM has additional minor tick lines at half-hour intervals in k-ui that chronix does not emit. `pxPerMs = axis.slotWidth / axis.slotDurationMs` produces the same ratio (60/3600000 = 30/1800000), so bar placement is identical (13/13 events match ±1px). The label-vs-slot collapse therefore does NOT cause visible drift today, but `axis.slotDurationMs` is not a like-for-like port of k-ui's `tDateProfile.slotDuration.asMs()`.

### Batch 2 — Layout algorithms

All five chronix layout passes match the k-ui reference at the observable level for the demo's exercised inputs. The bar-stack-height formula, swimlane Y stacking, bar placement (both implicit and explicit-`barHeight` modes), and the elbow/Bézier link routing each match k-ui's `calculateRowHeights`, `TimelineLane`, and `DependencyLineAlgorithm.setSmoothPoints` semantically — chronix uses a precomputed "max-level" greedy pack while k-ui uses `SegHierarchy`, but both produce the same per-row pixel height for the demo's non-pathological event sets. Two intentional-and-documented gaps: backward smooth routing is parked (k-ui implements it with a C+S compound curve; chronix throws), and same-row backward links are not currently routed at all in chronix (k-ui's `setSquarePoints` handles the `sameRow && targetOnLeft` and `cross-row backward` cases as a four-segment detour). The remaining 12 algorithms (bar placement, orphan/out-of-range handling, virtualized ranges, contentSize, rowspans) are 🟢 OK.

| Algorithm                                 | chronix file:lines                                                                        | k-ui file:lines                                                                                             | Verdict | Note                                                                                                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. BarStackHeightPass formula             | `packages/gantt/src/layout/bar-stack-height-pass.ts:30-72`                                | `resource-timeline/GanttView.tsx:2046-2148`                                                                 | 🟢      | Same formula (`topPad + maxBottom + bottomPad`, floor `minRowHeight`); chronix greedy max-level === k-ui `SegHierarchy` max stack for non-strict-order inputs the demo uses |
| 1b. Axis intersection filter              | `bar-stack-height-pass.ts:36-54`                                                          | `TimelineLaneSlicer.ts:42-67`                                                                               | 🟢      | Both drop bars entirely outside axis range from height contribution                                                                                                         |
| 2. RowSwimlaneLayout flat Y stack         | `packages/gantt/src/layout/row-swimlane-layout.ts:16-37`                                  | (implicit in `GanttView.tsx` row layout + `ResourceList.tsx`)                                               | 🟡      | k-ui has no analogous standalone "swimlane" pass — rows laid out by browser table flow with `rowHeights[]`. Output observably equivalent (y[i+1] = y[i] + h[i] + spacing)   |
| 3. BarPlacementPass x/y/w/h               | `packages/gantt/src/layout/bar-placement-pass.ts:17-54`                                   | `TimelineLane.tsx:107-115, 248-269` + `GanttView.tsx:1532-1542`                                             | 🟢      | x = (start − axisStart) × pxPerMs, width = duration × pxPerMs, height = `eventMinHeight`/`barHeight`, y = `strip.y + padding` match                                         |
| 4. BarPlacement orphans                   | `bar-placement-pass.ts:30-35`                                                             | (n/a — k-ui rows always exist for resources)                                                                | 🟢      | Empty in demo                                                                                                                                                               |
| 5. BarPlacement out-of-range (negative x) | `bar-placement-pass.ts:44-49`                                                             | `TimelineLaneSlicer.ts:56-66`                                                                               | 🟢      | Both keep the seg/bar; render layer clips                                                                                                                                   |
| 6. LinkRouter square 3-segment elbow      | `packages/gantt/src/layout/link-router.ts:50-53 + 87-109`                                 | `DependencyLineAlgorithm.ts:315-342` (forward branch)                                                       | 🟢      | Both: `M from → L midX,fromY → L midX,toY → L to`. See 6b for nub-x divergence                                                                                              |
| 6b. Square nub geometry constant          | `link-router.ts:50-53` (`nub=12`)                                                         | `DependencyLineAlgorithm.ts:230, 320-325` (`beforeTargetX=toX−20`)                                          | 🟡      | chronix anchors elbow `from.x + 12`; k-ui anchors at `to.x − 20`. Same 3-segment topology; vertical leg at different x                                                      |
| 7. LinkRouter smooth Bézier forward       | `link-router.ts:70-85`                                                                    | `DependencyLineAlgorithm.ts:417-457`                                                                        | 🟢      | Both emit `M from → C (midX, fromY) (beforeTargetX − 10, toY) (beforeTargetX, toY) → L to`                                                                                  |
| 7b. Smooth same-row forward shortcut      | `link-router.ts:71-75`                                                                    | `DependencyLineAlgorithm.ts:408-414`                                                                        | 🟢      | Both collapse `fromY === toY && toX ≥ fromX` to straight `M → L`                                                                                                            |
| 8. LinkRouter backward smooth (parked)    | `link-router.ts:111-118` (throws)                                                         | `DependencyLineAlgorithm.ts:458-513` (C+S compound) + `370-405` (same-row left)                             | ⏸️      | Parked. Demo doesn't exercise                                                                                                                                               |
| 8b. Square backward routing               | `link-router.ts:50-53` (direction-agnostic)                                               | `DependencyLineAlgorithm.ts:234-314` (target-on-left detour: right→down→left→down, 4 inner points)          | 🟡      | chronix elbow runs back-tracking through source bar when `to.x < from.x`; k-ui does 5-segment detour. Not in demo                                                           |
| 9. LinkRouter orphan handling             | `link-router.ts:97-102` + `chronix-gantt.ts:506-517`                                      | (k-ui resolves via DOM lookup, missing = silent skip)                                                       | 🟢      | Both drop orphans from render; chronix warns once                                                                                                                           |
| 10. LinkRouter marker color resolution    | `link-router.ts:134-139` + `chronix-gantt.ts:1098` (`routed.color ?? t.linkDefaultColor`) | `ResourceTimelineDependencies.tsx` (`dependencyLineColor` + per-link override)                              | 🟢      | Per-link override falls back to chart-level default                                                                                                                         |
| 11. VirtualizedPane visible strip range   | `packages/gantt/src/layout/virtualized-pane-layout.ts:66-99`                              | (none — k-ui doesn't virtualize the gantt body)                                                             | 🟡      | chronix's virtualization is additive and currently unused at the render layer (still computed but body draws all strips)                                                    |
| 11b. VirtualizedPane visible slot range   | `virtualized-pane-layout.ts:101-128`                                                      | (same — n/a)                                                                                                | 🟡      | Same disposition as 11                                                                                                                                                      |
| 12. VirtualizedPane overscan              | `virtualized-pane-layout.ts:33-35, 94-97, 123-126`                                        | (n/a)                                                                                                       | ⏸️      | chronix-only knob                                                                                                                                                           |
| 13. VirtualizedPane contentSize           | `virtualized-pane-layout.ts:37-38, 59-64`                                                 | (k-ui ScrollGrid handles via DOM measurement)                                                               | 🟢      | width = axis.totalWidth; height = sum of strip heights                                                                                                                      |
| 14. computeRowSpans (vGrouping merge)     | `adapters/vue3/src/chronix-gantt.ts:259-279`                                              | `resource/common/resource-hierarchy.ts:78-99` + `ResourceList.tsx:207-243` + `resourceTableLayout.ts:64-77` | 🟢      | Both: walk consecutive rows sharing column-value; first row gets `rowSpan = N`, absorbed rows get `rowSpan = 0`                                                             |

#### Drift details (Batch 2)

##### 6b. Square nub geometry constant (🟡)

chronix's square elbow turns 12px to the right of the source's right edge. k-ui's square elbow turns at `toX − 20` (20px to the left of the target's left edge). For two bars 200 px apart, chronix's vertical leg is at `fromX + 12` and k-ui's is at `toX − 20` — DIFFERENT vertical-leg X positions, same 3-segment topology. PHASE_8_LINK_RENDERING_DESIGN.md is silent on this constant. **Recommendation**: align with k-ui's `toX − 20` OR document the 12-px-from-source choice as a deliberate change. Not 🔴 because demo uses `smooth` routing.

##### 8b. Square backward routing (🟡)

chronix's `routeSquarePath` is direction-agnostic — when `to.x < from.x` it emits a 3-segment elbow that back-tracks through the source bar. k-ui's `setSquarePoints` recognizes `toX < fromX` and emits a 5-segment detour. chronix demo doesn't exercise backward links, but a downstream consumer constructing a circular dependency with `routing: 'square'` would get a visibly different path.

##### 2. RowSwimlaneLayout (🟡)

k-ui has no standalone "swimlane Y placement" algorithm — the timeline body sits inside an HTML `<tbody>` whose `<tr>` heights come from `calculateRowHeights`, and `rowY` is computed inline by accumulating `effectiveRowHeights`. chronix promotes this to a typed data pass with explicit `rowSpacing` knob. No semantic drift; shape difference only.

##### 11 + 11b. VirtualizedPane visible ranges (🟡)

k-ui doesn't virtualize the gantt body. chronix's pass is well-tested but not wired into the render path. Pure data infra; no observable drift today.

### Batch 3 — Interaction (core) algorithms

Chronix's interaction layer reproduces k-ui's observable I/O for the four transaction kinds plus hit-test and cross-row drop, but does so with a chronix-native architecture (pure geometry hit-test + delta-from-origin math) rather than k-ui's "queryHit returns snap-aligned dateSpan" architecture. Snap math is the most subtle area: k-ui snaps the anchor and current points independently then takes the delta; chronix snaps the delta directly. Both produce identical multiples of `snapDurationMs` when the axis origin and slot grid are shared, which is the demo's case. The biggest semantic gap is the **drag-distance gate**: k-ui has a 5-px `eventDragMinDistance` Pythagorean threshold (set on `FeaturefulElementDragging.minDistance`) before any `dragstart` / `hitupdate` fires, while chronix uses a strict 0-delta check (Phase 12 + 16). Demo gestures move well past 5 px so observable outputs match, but a 1-4 px wiggle commits a 1-4 px-mapped drag in chronix and is suppressed in k-ui — flagged 🟡, not blocking for the recorded demo.

| Algorithm                                                        | chronix file:lines                                           | k-ui file:lines                                                                              | Verdict | Note                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. PointerHitTester zone hierarchy + edge width                  | `packages/gantt/src/interaction/pointer-hit-test.ts:105-174` | `timeline/TimelineEvent.tsx:60-103`, `EventDragging.ts:122-127`                              | 🟢      | progress > edge > body > empty-row; edge zone 8 px matches `edgeResizeZone = 8`                                                                                                      |
| 2. requireInitialHit escape valve                                | `pointer-capture-session.ts:14-31, 287, 323, 350, 386`       | `interaction/interactions/HitDragging.ts:39, 62-80`; `EventProgressing.ts:79`                | 🟢      | Same semantic: `false` → start even if pointerdown missed subject                                                                                                                    |
| 3. defaultStripResolver.atY (half-open)                          | `swimlane-strip-at-y.ts:33-42`                               | `HitDragging.ts:182-188`                                                                     | 🟢      | `y >= strip.y && y < strip.y + height` matches k-ui's `>= 0 && < width/height`                                                                                                       |
| 4. BarDragTransaction.begin                                      | `pointer-capture-session.ts:286-296`                         | `EventDragging.ts:97-133, 135-159`                                                           | 🟡      | Chronix pins `originPx` at begin; k-ui pins via PointerDragging + initialHit/coordAdjust. Output identical                                                                           |
| 5. BarDragTransaction.advance                                    | `pointer-capture-session.ts:298-304`                         | `EventDragging.ts:166-382` (handleHitUpdate)                                                 | 🟡      | Idempotent `current - origin`; k-ui's advance is hit-based (re-queryHit each move). Final delta equal                                                                                |
| 6. BarDragTransaction.commit + snap                              | `pointer-capture-session.ts:306-320`                         | `EventDragging.ts:634-683` (computeEventMutation)                                            | 🟡      | Chronix delta-snaps; k-ui point-snaps both anchor + current then diffs. Mathematically equivalent for shared-axis-origin demo case                                                   |
| 7. BarResizeTransaction.commit                                   | `pointer-capture-session.ts:365-383`                         | `EventResizing.ts:302-318` (computeMutation)                                                 | 🟡      | Cross-over (start>end) policy differs: k-ui rejects; chronix allows at session level (caller policy). Demo doesn't exercise                                                          |
| 8. ProgressHandleTransaction.advance                             | `pointer-capture-session.ts:335-341`                         | `EventProgressing.ts:168-293`                                                                | 🟢      | `progressDelta = deltaX / barWidth × 100`; identical formula                                                                                                                         |
| 9. Progress-handle recording-replay                              | `adapters/vue3/src/progress-handle-replay.test.ts:106-180`   | demo log: `progress-handle-drag/log.json` (50→51%, deltaX=60, barWidth=6060)                 | 🟢      | Asserts `Math.round(newProgress) === 51`; recording oracle holds                                                                                                                     |
| 10. CalendarRangeSelectTransaction.advance                       | `pointer-capture-session.ts:396-398`                         | `DateSelecting.ts:66-104`                                                                    | 🟢      | Time-space at boundary; caller does px→time. Equivalent                                                                                                                              |
| 11. CalendarRangeSelectTransaction.commit (end-independent snap) | `pointer-capture-session.ts:400-414`                         | `DateSelecting.ts:127-156` (joinHitsIntoSelection)                                           | 🟢      | Min/max + per-end `round(t/snap)*snap`; both ends independently snap-aligned                                                                                                         |
| 12. Snap-to-grid in BarDrag/BarResize                            | `pointer-capture-session.ts:309-312, 367-371`                | `timeline-date-profile.ts:124-139`, `EventDragging.ts:661-666`                               | 🟡      | Delta-snap vs point-snap-then-delta. Equivalent for the demo's shared-origin / shared-grid case                                                                                      |
| 13. Snap-to-grid in CalendarRangeSelect                          | `pointer-capture-session.ts:406-409`                         | `DateSelecting.ts:127-156` + queryHit                                                        | 🟢      | End-independent; identical observable                                                                                                                                                |
| 14. 0-delta abort vs drag-distance gate                          | `use-gantt-pointer.ts:383-418` (lazy-fire on non-zero)       | `FeaturefulElementDragging.ts:101-125, 164-167` (`minDistance=5` via `eventDragMinDistance`) | 🟡      | K-ui requires sqrt(dx²+dy²) ≥ 5 px before `dragstart`; chronix fires start on first non-zero delta. User-observable for 1-4 px wiggles only                                          |
| 15. Cross-row drag projection                                    | `use-gantt-pointer.ts:542-547` (projectedRowId)              | `HitDragging.ts:136-143` (handleMove re-queryHit per pointermove)                            | 🟢      | Both update live, null in gaps                                                                                                                                                       |
| 16. Cross-row drop snap + revert rule                            | `use-gantt-pointer.ts:452-478` (commitDrag fallback)         | `EventDragging.ts:283-298, 408-446` (finalHit equals initialHit → revert)                    | 🟢      | Null projection → `newRowId === oldRowId`; equivalent to k-ui's revert-on-equal-hit                                                                                                  |
| 17. Phase 16 lifecycle latch                                     | `use-gantt-pointer.ts:259, 408-417, 430-436, 526-533`        | `EventDragging.ts:135-159` + `408-456`; `EventResizing.ts:112-132, 224-249`                  | 🟡      | Chronix fires start on first non-zero advance (lazy-fire); k-ui fires when `isDragging=true` after the 5-px gate. Lazy vs distance-gate trigger diverges in 1-4 px wiggle range only |

#### Drift details (Batch 3)

##### 6 + 12. Bar-drag commit + snap math (🟡)

Chronix snaps the raw pixel delta: `timeDeltaMs = round((deltaX / pxPerMs) / snap) * snap`. K-ui snaps via the hit machinery: `queryHit` at position `p` returns a `dateSpan` whose `.range.start` is already snap-aligned. The mutation delta is `diffDates(hit0.dateSpan.range.start, hit1.dateSpan.range.start)`. Both approaches yield the same final `bar.range.start` when the axis origin coincides with a snap boundary (always true in chronix's demos). Edge cases where they could diverge: (a) axis origin set to non-snap-aligned date, (b) snap that doesn't whole-divide the slot duration (k-ui guards via `wholeDivideDurations`; chronix doesn't). Neither is in the demo.

##### 7. Bar-resize cross-over (🟡)

Chronix's `commitBarResize` permits `resolvedRange.start > resolvedRange.end` when the user crosses the pinned edge — explicitly delegated to caller policy. K-ui's `computeMutation` returns `null` when the resize would invert, so the mutation is silently rejected and the bar reverts. Demo doesn't exercise.

##### 14 + 17. Drag-distance gate vs 0-delta gate (🟡)

K-ui enforces `distanceSq >= minDistance²` with `minDistance = 5` from `eventDragMinDistance: 5` before transitioning to `isDragging = true`. A user who clicks and wiggles 4 px sees zero drag events. Chronix uses strict 0-delta to lazy-fire `onBarDragStart`. Result: a 1-4 px wiggle on chronix produces an `onBarDragStart` + a tiny `bar-drop` commit (delta < 1 snap unit ⇒ snap rounds to 0 ms ⇒ no visible time change, but lifecycle fires). On k-ui the wiggle is squelched entirely. For typical bar-drag gestures (≥ axis slot width = 60 px), both implementations fire start once. **Recommendation**: add a configurable `dragMinDistance` to `useGanttPointer` with default 5 to match.

### Batch 4 — Adapter / Render algorithms

Chronix's adapter+render layer is in solid parity with k-ui for the demo-exercised paths (rendering, selection, link routing, sidebar resize, theme merge), but the audit uncovered four shape-level differences worth tracking and one true logic gap. The marker-render path (Algorithms 3–8) is the largest cluster of intentional drift: chronix emits **horizontal-only** markers (no `vertical-up`/`vertical-down` variant), and chronix's `<defs>` loop iterates over **all 7 built-in marker types regardless of usage** rather than the per-render `usedMarkerTypes` set k-ui builds. Both shape divergences collapse to identical pixel output for the chronix demo because all routes are horizontal-only and `marker-end` resolution names the same id chronix actually emits. Chronix's `CustomLinkMarker` is **data-shape** (`{id, viewBox, paths[]}` with hard-coded `refX=4 refY=2.25 orient='auto'`) where k-ui's is a **callback** that receives `{markerId, color, direction}`. Drag-vs-click discrimination uses different mechanisms (chronix `wasDragCommit` ref; k-ui `data-just-dragged` DOM breadcrumb) but converges on the same observable rule. Rowspan, theme merge, sidebar resize, selection set, slot registry, and progress-fill rendering are functionally identical modulo identifier names. The one true v0 gap: chronix has no `selectMirror`-style overlay during drag.

| Algorithm                                            | chronix file:lines                                            | k-ui file:lines                                                  | Verdict | Note                                                                                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Drag-vs-click discrimination                      | `adapters/vue3/src/chronix-gantt.ts:706-749`                  | `interactions/EventClicking.ts:30-48` + `EventDragging.ts`       | 🟢      | Different mechanism (state-flag vs DOM breadcrumb), identical rule                                                                                  |
| 2. Phase 16 lifecycle latch / `buildDragPayload`     | `chronix-gantt.ts:529-579, 686, 702, 722, 759`                | `EventDragging.ts` (delta/eventApi payload)                      | 🟡      | Different payload shapes; same observable triggers                                                                                                  |
| 3. Built-in marker rendering (7 types)               | `chronix-gantt.ts:114-176`                                    | `ResourceTimelineDependencies.tsx:288-540`                       | 🟡      | Geometry IDENTICAL for horizontal; chronix omits vertical-up/down variants                                                                          |
| 4. Custom marker rendering                           | `chronix-gantt.ts:187-217`                                    | `ResourceTimelineDependencies.tsx:299-311, 2940-2974`            | 🟡      | Chronix data shape vs k-ui callback. Refx/refY fixed in chronix                                                                                     |
| 5. markerColorId encoding                            | `chronix-gantt.ts:89-91`                                      | `ResourceTimelineDependencies.tsx:2916, 4315`                    | 🟢      | Identical regex `/[^a-zA-Z0-9]/g` → `''`                                                                                                            |
| 6. markerEndUrl logic                                | `chronix-gantt.ts:224-229`                                    | `ResourceTimelineDependencies.tsx:4355-4356, 4488-4489`          | 🟡      | Different id schema; both omit `marker-end` correctly for 'none'                                                                                    |
| 7. Default link color cascade                        | `chronix-gantt.ts:1098` + `theme.linkDefaultColor`            | `ResourceTimelineDependencies.tsx:1978, 4304-4307`               | 🟢      | Both default to `'#3788d8'`                                                                                                                         |
| 8. Marker `<defs>` dedup / usedColors                | `chronix-gantt.ts:1116-1143`                                  | `ResourceTimelineDependencies.tsx:2667-2829, 2912-2978`          | 🟡      | k-ui emits only `usedMarkerTypes × usedColors`; chronix emits ALL 7 builtins × usedColors. Dead DOM, no pixel diff                                  |
| 9. Link `<path>` pointer-events='none'               | `chronix-gantt.ts:1166` (on parent `<g>`)                     | `ResourceTimelineDependencies.tsx:2900-2908` (on parent `<svg>`) | 🟢      | Both place on ancestor                                                                                                                              |
| 10. Wrapper layout (sticky-header, scroll)           | `chronix-gantt.ts:870-899, 1402-1421`                         | `ResourceTimelineLayout.tsx:81-197`                              | 🟡      | k-ui has TWO scroll containers with JS-coordinated sync; chronix has ONE with `position:sticky`. Different scroll plumbing, equivalent end behavior |
| 11. Sidebar wrapper geometry (3-col grid + z-ladder) | `chronix-gantt.ts:1402-1407`                                  | `ResourceTimelineLayout.tsx:88-93, 99-149`                       | 🟡      | Different grid columns + slightly different z-ladder; both put divider at top of stack                                                              |
| 12. vGrouping rowspan merge                          | `chronix-gantt.ts:259-279, 1282-1357`                         | `ResourceList.tsx:206-376` + `buildRowNodes`                     | 🟢      | Both: span>1 = rowspan; span===0 = skip. Same matrix                                                                                                |
| 13. Sidebar double `<colgroup>` factory              | `chronix-gantt.ts:1195-1200`                                  | `ResourceList.tsx:104-108` + `ResourceListHeader:504-508`        | 🟢      | Phase 14 fix matches k-ui's natural two-table structure                                                                                             |
| 14. Sidebar divider drag                             | `chronix-gantt.ts:74, 621-658`                                | `ResourceTimelineLayout.tsx:5, 304-335`                          | 🟡      | MIN=40 (chronix) vs MIN=30 (k-ui) documented. Chronix lacks RTL handling (k-ui multiplies delta by `isRtl ? -1 : 1`)                                |
| 15. Theme merge                                      | `chronix-gantt.ts:434-437` (shallow `{...defaults, ...prop}`) | CSS custom properties at root                                    | 🟡      | k-ui CSS vars vs chronix JS shallow merge; documented chronix-native                                                                                |
| 16. Slot registry resolve                            | `packages/gantt/src/render/create-slot-registry.ts:20-36`     | per-option content callback hooks + `ContentContainer`           | 🟡      | Different surface; both replace default render                                                                                                      |
| 17. Bar slot render path / args                      | `chronix-gantt.ts:951-985` + `bar-slot.ts:30-48`              | `TimelineEvent.tsx:182-300` (renderProps in event-rendering.ts)  | 🟡      | Different shapes; chronix's `activeTransaction` substitutes k-ui's `isDragging/isResizing/isMirror` flags                                           |
| 18. Selection set management                         | `use-gantt-selection.ts:97-148`                               | `UnselectAuto.ts` + reducers                                     | 🟡      | k-ui uses `ctrlKey or metaKey` for toggle; chronix uses `shiftKey` — documented intentional                                                         |
| 19. Default `<rect>` markup                          | `chronix-gantt.ts:987-997`                                    | `TimelineEvent.tsx:354-356, 276` (`gantt-event-selected`)        | 🟡      | Chronix omits `tabIndex={0}` — documented parked (Phase 13)                                                                                         |
| 20. Progress fill + handle overlay                   | `chronix-gantt.ts:1013-1053`                                  | `TimelineEvent.tsx:251-256, ~397+` + `EventProgressing.ts`       | 🟢      | Both live-update via projected value                                                                                                                |
| 21. Progress label text                              | `chronix-gantt.ts:1057-1082`                                  | `TimelineEvent.tsx:225-229`                                      | 🟢      | `progress.textFormat ?? '{value}%'` with `{value}` → rounded; `showText !== false` gate identical                                                   |
| 22. Live render geometry during drag                 | `chronix-gantt.ts:901-947`                                    | `EventDragging.ts` + mirror rendering                            | 🟡      | Chronix in-place geometry shift; k-ui separate mirror element. Both produce same on-screen position                                                 |
| 23. Link defs dedup                                  | `chronix-gantt.ts:1123-1143`                                  | `ResourceTimelineDependencies.tsx:2667-2829, 2912-2978`          | 🟡      | See #8 — color axis matches; marker-type axis is exhaustive in chronix vs minimal in k-ui                                                           |

#### Drift details (Batch 4)

##### 3 + 23. Built-in marker rendering — vertical-direction variants + exhaustive emit (🟡)

K-ui emits three direction variants per (type × color): `horizontal`, `vertical-down`, `vertical-up` — each with distinct `refX`/`refY`/`orient`. Chronix renders only the horizontal variant. The link router currently only emits horizontal-attaching path segments, so no `marker-end` URL ever references a vertical variant. K-ui also builds `usedMarkerTypes: Set<MarkerType>` and only emits used pairs; chronix iterates ALL 7 built-in types × usedColors. For a 1-color demo: 7 chronix `<marker>` defs vs k-ui's 1. Pure DOM-size overhead. **Recommendation**: track as low-priority cleanup; pair with link-routing audit if vertical-approach paths get added.

##### 4. Custom marker shape — data vs callback (🟡)

K-ui's `CustomMarkerDef.render({ markerId, color, direction })` is a user-supplied function. Chronix's `CustomLinkMarker` is static data with `refX=4 refY=2.25 orient='auto'` hard-coded. Consumers wanting custom refX/refY must embed in the path's `d` string. **Recommendation**: document explicitly in the public README OR generalize to a callback if a consumer asks.

##### 10–11. Wrapper layout (sticky-header scroll plumbing) (🟡)

K-ui has TWO independent scroll containers (`gantt-timeline-body-left` + `gantt-timeline-body-right`) with JS-coordinated vertical sync + horizontal `translateX` on header. Chronix has ONE scroll container with `position: sticky`. K-ui's two-container approach allows a horizontally-scrollable sidebar (multi-column resource panel wider than visible sidebar); chronix v0 doesn't. Surfaced visually in Phase 21 session (2026-05-16) — user observed k-ui's sidebar has its own scrollbar but chronix's wrapper has one combined scrollbar. **→ Tracked as Phase 23 (sidebar dual-scrollport architecture)**. Promoted from "Park" to "Planned" so the entry doesn't drift into forgotten state per `feedback_no_logic_drift_from_kui.md`. Scope sketch: split current single wrapper into two `overflow: auto` scrollports (sidebar + timeline body), add JS scroll-sync for vertical alignment, replace `position: sticky` header pinning with `translateX`-driven horizontal sync, capture new VRT baselines (cross-demo + chronix-VRT) for the scroll behavior. Estimated ~6-8h single session.

##### 14. Sidebar divider — RTL (🟡)

K-ui multiplies drag-delta by `isRtl ? -1 : 1`. Chronix has no RTL branch. **Park** as documented limitation; trivial to add.

##### 19. Default `<rect>` — tabIndex / a11y (🟡)

K-ui's event renders with `tabIndex={0}` making bars keyboard-focusable. Chronix's default `<rect>` has no `tabIndex`. Phase 13 design doc parked keyboard nav.

##### 22. Live render geometry — mirror vs in-place (🟡)

K-ui renders a separate mirror element. Chronix mutates the bar's own render geometry in place. Both produce the same on-screen position. Track as architectural note for any future "show old + new position simultaneously" feature.

## Coverage inventory (k-ui features chronix hasn't touched)

### Batch 5 — Feature surface enumeration

**Summary**: K-ui's `gantt` package exposes ~171 distinct public surface items across base option refiners (~100), gantt-scheduler-specific options (~10), view-specific options (~5), listener refiners (~16 public), resource-specific options (~25), resource-timeline-specific options (~10), and the imperative `GanttSchedulerImpl` (~30 methods). Chronix R2 v0 deliberately runs minimum-viable: of the ~171 k-ui items inventoried below, roughly **18 are ✅ COVERED**, **16 are 🟡 PARTIAL**, **2 are ⏸️ PARKED with a phase doc**, and **~135 are ❌ NOT TOUCHED** (no code, no design note). The vast majority of demo-exercised options (locale, businessHours, todayLine, dependency-line styling callbacks, eventColor pipeline, resource hierarchy, view-switch toolbar, scrollToTime / gotoDate, validation callbacks, recurring events, event sources) have no chronix counterpart.

#### Coverage summary table

| Area                                     | ✅ COVERED | 🟡 PARTIAL | ⏸️ PARKED | ❌ NOT TOUCHED | Total   |
| ---------------------------------------- | ---------- | ---------- | --------- | -------------- | ------- |
| 1. View management                       | 0          | 2          | 0         | 4              | 6       |
| 2. Date / time / locale                  | 0          | 2          | 0         | 21             | 23      |
| 3. Resource management                   | 1          | 2          | 1         | 13             | 17      |
| 4. Event lifecycle / CRUD                | 0          | 2          | 0         | 8              | 10      |
| 5. Event rendering / styling             | 3          | 1          | 0         | 9              | 13      |
| 6. Event interaction                     | 3          | 0          | 0         | 11             | 14      |
| 7. Toolbar / chrome                      | 0          | 0          | 0         | 6              | 6       |
| 8. Now-indicator / today-line            | 0          | 0          | 0         | 5              | 5       |
| 9. Background events                     | 0          | 0          | 0         | 2              | 2       |
| 10. Business hours                       | 0          | 0          | 0         | 2              | 2       |
| 11. Selection / unselection              | 2          | 1          | 0         | 3              | 6       |
| 12. Validation callbacks                 | 0          | 0          | 0         | 7              | 7       |
| 13. Programmatic API / imperative handle | 2          | 2          | 0         | 13             | 17      |
| 14. Lifecycle emits                      | 4          | 3          | 0         | 11             | 18      |
| 15. Theming / styling hooks              | 2          | 1          | 0         | 6              | 9       |
| 16. Multi-month / multi-view             | 1          | 0          | 0         | 2              | 3       |
| 17. Misc                                 | 0          | 0          | 1         | 12             | 13      |
| **Totals**                               | **18**     | **16**     | **2**     | **135**        | **171** |

#### Highest-impact parity gaps (features the demo actively exercises but chronix has no code for)

1. **View-switch toolbar** — demo wires `headerToolbar`, today / prev / next buttons, and 6 view-toggle buttons. Chronix `GanttHandle.changeView` is typed but unimplemented. Without this, chronix can't be drop-in for the demo.
2. **`eventColor` / `eventBackgroundColor` / `eventBorderColor` / `eventTextColor` (4 options + 3 callback variants)** — demo wires all of them. Chronix has no per-bar color pipeline; consumer must inject custom slot template.
3. **`todayLine: TodayLineOption | false`** — demo toggle controls it. Chronix has no today-line rendering.
4. **`nowIndicator` + 4 render hooks** — k-ui's `NowTimer` is a built-in animation.
5. **`businessHours`** — entirely absent.
6. **Validation callbacks (`eventAllow` / `selectAllow` / `eventOverlap` / `eventConstraint`)** — every drag/resize commits unconditionally in chronix; no veto pathway.
7. **`eventDataTransform`** — chronix accepts only its native `BarSpec` shape; the demo's k-ui event shape doesn't ingest as-is.
8. **`addEvent` / `removeEvent` / event-CRUD on the handle** — no way to mutate bars from outside via imperative API; only commit-via-drag is supported.
9. **`scrollToTime`** — no scroll API at all on handle.
10. **`dependencyLineColor` / `useLineEventColor` / `onLine` callback** — demo wires all three for link styling; chronix only supports per-`LinkSpec.color`.

#### Detailed feature surface (171 items)

See the agent run output reproduced in [`audit/journal/2026-05-13.md`](journal/2026-05-13.md)
"Phase 16 — Parity re-check Batch 5" section for the full table per
area (kept out of this top-level doc for length; the summary above is
the navigable index).

## Action items

Severity legend (relative to "L2 parity for the current demo"):

- **P0** — blocks demo parity right now (visible drift OR demo
  feature missing).
- **P1** — affects parity for hosts that toggle a k-ui feature the
  demo doesn't currently exercise.
- **P2** — DOM-shape / architectural divergence with same observable
  output today; future-proofing or cleanliness.
- **P3** — chronix-only feature with no k-ui counterpart; document
  status, no action required.

| Severity | Item                                                                                                        | Source verdict           |
| -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------ |
| **P0**   | `weekendsVisible` plumbed but not read by axis-range-planner — flips an entire axis when toggled            | Batch 1 #10 🔴           |
| **P0**   | View-switch toolbar absent — `headerToolbar` / `today` / `prev` / `next` / view buttons                     | Batch 5 §7               |
| **P0**   | `eventColor` family (4 options + 3 callbacks) absent — demo wires all                                       | Batch 5 §5               |
| **P0**   | `todayLine` rendering absent — demo toggles it                                                              | Batch 5 §8               |
| **P0**   | `nowIndicator` + 4 render hooks absent                                                                      | Batch 5 §8               |
| **P0**   | Validation callbacks (`eventAllow` / `selectAllow` / `eventOverlap` / `eventConstraint`) absent             | Batch 5 §12              |
| **P0**   | `eventDataTransform` — chronix can't ingest k-ui's demo event shape as-is                                   | Batch 5 §4               |
| **P0**   | Imperative event CRUD (`addEvent` / `removeEvent` / `getEvents` etc.) on handle                             | Batch 5 §13              |
| **P0**   | `scrollToTime` + navigation API (`prev` / `next` / `today` / `gotoDate`)                                    | Batch 5 §13              |
| **P0**   | `dependencyLineColor` / `useLineEventColor` / `onLine` callback for links                                   | Batch 5 §15              |
| **P0**   | `businessHours`                                                                                             | Batch 5 §10              |
| **P0**   | Recurring events + event sources (URL / function / JSON feed)                                               | Batch 5 §4               |
| **P0**   | Resource hierarchy expand/collapse + resource CRUD API + resource emits                                     | Batch 5 §3               |
| **P0**   | DOM lifecycle hooks (`eventDidMount` / `eventWillUnmount` / 13 other `*DidMount` / `*WillUnmount` families) | Batch 5 §5 + §15         |
| **P0**   | `datesSet` / `viewDidMount` / `viewWillUnmount` / `windowResize` / `loading` emits                          | Batch 5 §14              |
| **P0**   | `unselect` emit + range `select()`/`unselect()` imperative                                                  | Batch 5 §11, §14         |
| **P0**   | `direction: 'ltr'\|'rtl'` global + per-component RTL                                                        | Batch 4 #14a, Batch 5 §7 |
| **P1**   | Square link nub geometry constant differs (12px right-of-source vs 20px left-of-target)                     | Batch 2 #6b 🟡           |
| **P1**   | Square link backward routing back-tracks through source                                                     | Batch 2 #8b 🟡           |
| **P1**   | Smooth link backward routing throws                                                                         | Batch 2 #8 ⏸️            |
| **P1**   | Drag-distance gate absent — chronix 0-delta vs k-ui 5px Pythagorean                                         | Batch 3 #14+17 🟡        |
| **P1**   | Bar-resize cross-over policy: chronix allows, k-ui rejects                                                  | Batch 3 #7 🟡            |
| **P1**   | Built-in vertical-direction marker variants absent (would matter for clipped/wrap-around paths)             | Batch 4 #3 🟡            |
| **P1**   | Custom marker is data-shape; lacks per-direction / per-color callback flexibility                           | Batch 4 #4 🟡            |
| **P1**   | Sidebar divider RTL flip absent                                                                             | Batch 4 #14 🟡           |
| **P1**   | Bar `tabIndex={0}` absent → keyboard not focus-able (Phase 13 parked)                                       | Batch 4 #19 🟡           |
| **P2**   | Day-view extra date header row (chronix shows; k-ui doesn't)                                                | Batch 1 #7 🟡            |
| **P2**   | day/week label-vs-slot model collapse (24 ticks vs 48 slots; same pxPerMs)                                  | Batch 1 #1+13 🟡         |
| **P2**   | Marker `<defs>` exhaustive emit — 7 variants per color even if only one used                                | Batch 4 #8+23 🟡         |
| **P2**   | Wrapper has ONE scroll container vs k-ui's TWO with sync — no horizontally-scrollable sidebar               | Batch 4 #10 🟡           |
| **P2**   | Selection toggle modifier: chronix `shiftKey` vs k-ui `ctrlKey or metaKey` (documented intentional)         | Batch 4 #18 🟡           |
| **P2**   | Live drag geometry: chronix in-place mutation vs k-ui mirror element                                        | Batch 4 #22 🟡           |
| **P2**   | Bar slot ctx surface narrower (chronix `activeTransaction` vs k-ui `isDragging/isResizing/isMirror/...`)    | Batch 4 #17 🟡           |
| **P2**   | VirtualizedPaneLayout computed but not wired into render                                                    | Batch 2 #11+11b 🟡       |
| **P3**   | `link-orphan` emit — chronix-only, no k-ui counterpart                                                      | Batch 5 §14              |
| **P3**   | `bar-progress` emit — chronix-only                                                                          | Batch 5 §14              |
| **P3**   | `MIN_SIDEBAR_AREA_WIDTH=40` vs k-ui 30 — documented intentional (chronix cell padding)                      | Batch 4 #14              |
| **P3**   | VirtualizedPaneLayout overscan + visible-strip-range — chronix-only forward-design                          | Batch 2 #11+12           |

### Disposition register (audit-sweep 2026-05-16, post-Phase-21)

The original recheck (2026-05-15) classified items by severity (P0/P1/P2/P3) but used the single word **"Park"** for everything not currently being worked on — collapsing three semantically distinct states (will fix on the roadmap / will fix only if asked / won't fix by design) into one ambiguous bucket. Per `feedback_no_logic_drift_from_kui.md`, parked items without explicit follow-up timing risk drifting into forgotten state.

This register classifies every P0/P1/P2/P3 entry above into one of four explicit dispositions:

- **DONE (Phase X)** — landed since the original recheck.
- **Planned (Phase X)** — assigned a phase number; on the roadmap.
- **Defer-indefinite** — no current plan; revisit only if a user reports a concrete blocker. Each entry names the condition that would re-prioritize it.
- **Reject** — deliberate chronix divergence; documented and not planned to change. Each entry names the rationale.

#### P0 — demo parity / visible drift

| Item                                                                                                        | Disposition          | Rationale / trigger                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `weekendsVisible` not read by axis-range-planner                                                            | **DONE Phase 18**    | Filter implemented in `planWeekView` + `planMonthBandedAxis` with parity assertion.                                                                                                                                                                 |
| View-switch toolbar absent (`headerToolbar` / `today` / nav)                                                | **DONE Phase 22**    | Data-driven `headerToolbar` prop with k-ui-parity string DSL, controlled-prop `v-model:axis-input` pathway, 3 cross-demo parity assertions (button set / pressed state / title presence) green. Click recording-replay infra parked to Phase 22.1.  |
| `eventColor` family (4 options + 3 callbacks)                                                               | **DONE Phase 20**    | Bar color pipeline landed with parity assertions.                                                                                                                                                                                                   |
| `todayLine` rendering                                                                                       | **DONE Phase 21**    | Pixel-perfect Δ=0.00 day-1 cross-demo parity.                                                                                                                                                                                                       |
| `nowIndicator` + 4 render hooks                                                                             | **Reject**           | User direction (Phase 21 session): static todayLine alone covers visible default parity; 5-min setTimeout machinery + tab-visibility + custom render hooks not worth the complexity. Revisit only if a user explicitly requests live "now" updates. |
| Validation callbacks (`eventAllow` / `selectAllow` / `eventOverlap` / `eventConstraint`)                    | **DONE Phase 19**    | All 4 wired with cross-demo color parity in Phase 19.                                                                                                                                                                                               |
| `eventDataTransform`                                                                                        | **Defer-indefinite** | Chronix's `BarSpec` is the native shape; the demo uses it directly. Re-prioritize if a real consumer needs to drop the k-ui demo's event shape into chronix without manual re-mapping.                                                              |
| Imperative event CRUD on handle (`addEvent` / `removeEvent` / `getEvents`)                                  | **Planned Phase 24** | Bundled with handle imperative API (next-gen `GanttHandle`).                                                                                                                                                                                        |
| `scrollToTime` + nav API (`prev` / `next` / `today` / `gotoDate`)                                           | **Planned Phase 24** | Part of the Phase 24 handle imperative API bundle.                                                                                                                                                                                                  |
| `dependencyLineColor` / `useLineEventColor` / `onLine` callback                                             | **Defer-indefinite** | Phase 20 bar-color pipeline covers most demo visible parity; link styling is uncritical. Re-prioritize if a user reports link color drift.                                                                                                          |
| `businessHours`                                                                                             | **Defer-indefinite** | Large scope (work-day calendaring + render layer + interaction filtering); no consumer demand. Re-prioritize if a user needs business-hour shading.                                                                                                 |
| Recurring events + event sources (URL / function / JSON feed)                                               | **Defer-indefinite** | Massive scope; not in demo. Re-prioritize if a user needs ical-style recurrence or remote data sources.                                                                                                                                             |
| Resource hierarchy expand/collapse + resource CRUD + resource emits                                         | **Defer-indefinite** | Chronix's `RowSpec.columns` covers flat hierarchy. Tree-hierarchy expand/collapse is large. Re-prioritize if a user reports a multi-level resource tree need.                                                                                       |
| DOM lifecycle hooks (`eventDidMount` / `eventWillUnmount` / 13 other `*DidMount` / `*WillUnmount` families) | **Defer-indefinite** | Chronix's slot registry pattern + `BarSlotArgs` covers most use cases. Re-prioritize if a consumer needs imperative DOM access at mount/unmount points.                                                                                             |
| `datesSet` / `viewDidMount` / `viewWillUnmount` / `windowResize` / `loading` emits                          | **Defer-indefinite** | Some bundled with Phase 24 (view-change); others tied to features not yet planned (loading state, viewWillUnmount). Re-prioritize per emit on user demand.                                                                                          |
| `unselect` emit + range `select()` / `unselect()` imperative                                                | **Defer-indefinite** | Phase 12 selection model covers the demo; imperative select/unselect parked. Re-prioritize if a consumer needs programmatic selection control.                                                                                                      |
| `direction: 'ltr'                                                                                           | 'rtl'` RTL           | **Defer-indefinite**                                                                                                                                                                                                                                | Tied to upstream's wider RTL infrastructure. Re-prioritize if a Hebrew/Arabic-locale consumer reports a need. |

#### P1 — affects parity for hosts toggling features the demo doesn't currently exercise

| Item                                                          | Disposition          | Rationale / trigger                                                                                                                                                                                                                                        |
| ------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Square link nub geometry 12 vs 20 px                          | **Defer-indefinite** | Demo uses `smooth` routing; square's cosmetic divergence isn't visible. Re-prioritize if a consumer renders square dependency lines.                                                                                                                       |
| Square link backward routing back-tracks through source       | **Defer-indefinite** | Demo doesn't exercise backward links. Re-prioritize if a consumer constructs circular dependencies with square routing.                                                                                                                                    |
| Smooth link backward routing throws                           | **Defer-indefinite** | Demo doesn't exercise. Re-prioritize on first user report of a smooth-backward exception.                                                                                                                                                                  |
| Drag-distance gate (chronix 0-delta vs k-ui 5-px Pythagorean) | **Planned Phase 25** | Small additive `dragMinDistance` option on `useGanttPointer` with default 5. Standalone single-session phase.                                                                                                                                              |
| Bar-resize cross-over policy (chronix allows, k-ui rejects)   | **Defer-indefinite** | Chronix's caller-policy delegation is more flexible. Re-prioritize if a consumer reports visual chaos from inverted ranges.                                                                                                                                |
| Built-in vertical-direction marker variants absent            | **Defer-indefinite** | Link router never emits vertical-approach paths today. Re-prioritize if a future router change introduces them.                                                                                                                                            |
| Custom marker shape — data vs callback                        | **Defer-indefinite** | Chronix's `CustomLinkMarker` data shape covers most cases. Re-prioritize if a consumer needs per-call `refX`/`refY`/`direction` customization.                                                                                                             |
| Sidebar divider — RTL multiplier                              | **Defer-indefinite** | Tied to the global RTL deferral.                                                                                                                                                                                                                           |
| Bar `tabIndex={0}` / keyboard focus                           | **Reject**           | Phase 13 (keyboard nav) was explicitly SKIPPED per parity discipline (chronix uses a different a11y model — focus is consumer-controlled via slot registry, not a global tabIndex). Won't add a default `tabIndex={0}` unless the a11y model is rewritten. |

#### P2 — DOM-shape / architectural divergence; same observable output today

| Item                                                      | Disposition          | Rationale / trigger                                                                                                                                                                              |
| --------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Day-view extra date header row                            | **Defer-indefinite** | Visual nit; chronix's render is arguably more informative. Re-prioritize if a user reports it as visual drift.                                                                                   |
| Day/week label-vs-slot collapse (24 ticks vs 48 slots)    | **Defer-indefinite** | No observable drift today (`pxPerMs` ratio is identical). Re-prioritize if a 30-minute-granularity feature needs `slotDurationMs ≠ tickDurationMs`.                                              |
| Marker `<defs>` exhaustive emit (7 builtins × usedColors) | **Defer-indefinite** | DOM-size overhead only, no pixel diff. Re-prioritize if a future render-perf audit flags it.                                                                                                     |
| Wrapper one-scroll vs k-ui's two-scroll architecture      | **Planned Phase 23** | Allocated this session (commit `9cde7e0`). ~6-8h scope: dual `overflow: auto` scrollports + JS scroll-sync + `translateX` header pinning.                                                        |
| Selection toggle modifier: `shiftKey` vs `ctrlKey         |                      | metaKey`                                                                                                                                                                                         | **Reject** | Phase 12 documented this as intentional. Most macOS apps use shift-for-range-select; chronix follows that convention. |
| Live drag geometry: chronix in-place vs k-ui mirror       | **Reject**           | Architectural choice — chronix's in-place mutation is simpler + matches its single-source-of-truth render approach. Revisit only if a feature requires "show old + new position simultaneously". |
| Bar slot ctx surface narrower                             | **Defer-indefinite** | Phase 22+ may expand `BarSlotArgs` if the toolbar / live-mirror surface requires additional flags. Re-prioritize per consumer request.                                                           |
| VirtualizedPaneLayout computed but not wired into render  | **Defer-indefinite** | Forward-design. Re-prioritize if a 10k+-bar performance test materializes.                                                                                                                       |

#### P3 — chronix-only feature with no k-ui counterpart

| Item                                                 | Disposition                   | Rationale                                                                                                     |
| ---------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `link-orphan` emit                                   | **Reject** (chronix-additive) | Chronix surfaces orphan link ids so consumers can react; k-ui silently drops. Useful debugging signal; keep.  |
| `bar-progress` emit                                  | **Reject** (chronix-additive) | First-class chronix event for progress drags; k-ui handles via DOM hooks. Keep.                               |
| `MIN_SIDEBAR_AREA_WIDTH=40` vs k-ui 30               | **Reject** (chronix-padding)  | Chronix uses larger cell padding so the 40-px floor preserves readable column labels. Documented intentional. |
| VirtualizedPaneLayout overscan + visible-strip-range | **Reject** (chronix-additive) | Forward-design for future virtualization; no k-ui counterpart by design. Keep.                                |

#### Counts (audit-sweep tally)

- **DONE since recheck**: 5 (weekendsVisible, eventColor family, validation callbacks, todayLine, toolbar).
- **Planned with phase number**: 4 (Phase 22.1 toolbar click recording-replay, Phase 23 dual-scrollport, Phase 24 imperative API + nav, Phase 25 drag-distance gate).
- **Reject (by-design)**: 8 (nowIndicator, bar tabIndex, selection modifier, live-drag mirror, link-orphan, bar-progress, MIN_SIDEBAR floor, VirtualizedPane overscan).
- **Defer-indefinite (revisit on demand)**: 21 (the rest).

Of the 17 P0 items in the original recheck: 5 DONE, 2 Planned (Phase 24×2 — event CRUD + nav imperative API), 1 Reject (nowIndicator), 9 Defer-indefinite. **The remaining demo-parity gap is 2 phases (23 + 24)**, plus the 22.1 follow-up for recording-replay infra and Phase 25 for the drag-distance gate.

### Silent-gap sweep additions (audit-sweep 2026-05-16)

The 2026-05-16 evening sweep (see [`SILENT_GAP_SWEEP_2026-05-16.md`](SILENT_GAP_SWEEP_2026-05-16.md)) enumerated the full k-ui public surface (~350 items across 7 source families) and found ~170 items NOT covered by the original recheck. Most compress into ~22 cluster-level dispositions; ~12 individuals are tracked separately.

The trigger was a user-reported silent gap: `todayBgColor` (k-ui's yellow today-column tint) existed in k-ui's demo but was not in any chronix PHASE catalog and not in this register. The sweep verified discipline coverage across every source family to find every such miss.

#### Individual dispositions added

| Item                                                                                         | Disposition            | Rationale / trigger                                                                                                                             |
| -------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `todayBgColor` theme token + `.gantt-day-today` CSS class                                    | **Planned Phase 22.2** | User-found silent gap. Bundle with `todayLine` default-ON flip in single session.                                                               |
| `selectMinDistance`                                                                          | **Planned Phase 25**   | Fold into Phase 25 drag-distance gate scope explicitly (was implicitly bundled).                                                                |
| `initialDate` / `initialView` / `dateIncrement` / `incrementDate` / `getDate()` / `zoomTo()` | **Planned Phase 24**   | Fold into Phase 24 imperative-API scope (originally only listed `prev/next/today/gotoDate`).                                                    |
| `prevYear` / `nextYear` toolbar widgets                                                      | **Defer-indefinite**   | Demo doesn't wire year-nav. Re-prioritize if consumer needs decade-scale navigation.                                                            |
| `validRange`                                                                                 | **Defer-indefinite**   | Pairs with toolbar's `isPrevEnabled` / `isNextEnabled` / `isTodayEnabled` (also parked). Re-prioritize on first consumer report.                |
| `now` option                                                                                 | **Reject**             | Tied to rejected `nowIndicator`. Chronix uses `Date.now()` directly with no override.                                                           |
| `themeSystem` (Bootstrap5 / etc)                                                             | **Reject**             | Chronix uses `theme` prop. Theme-system swapping is a different model.                                                                          |
| `eventSelectedOverlayColor` theme token                                                      | **Defer-indefinite**   | Phase 12 added `.cx-gantt-bar--selected` CSS class but no theme token. Re-prioritize if consumer needs themed (not CSS-class-driven) selection. |

#### Cluster dispositions added (each row covers many k-ui items)

| Cluster                                                                                  | Disposition          | Items folded                                                                                                                                                                                                                                                                                        | Rationale / trigger                                                                                                         |
| ---------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Toolbar i18n + custom-button + icon override                                             | **Defer-indefinite** | `buttonText`, `buttonHints`, `customButtons`, `buttonIcons`, `bootstrapFontAwesome`, `titleRangeSeparator`, `defaultRangeSeparator`, `viewHint`, `viewSpec.buttonTextOverride`                                                                                                                      | Lands when consumer needs toolbar i18n or custom button widgets.                                                            |
| Event lifecycle hook surface                                                             | **Defer-indefinite** | `eventDidMount`, `eventWillUnmount`, `eventClassNames`, `EventMountArg.el`                                                                                                                                                                                                                          | Lands when consumer needs ref-to-DOM at event mount/unmount (slot-registry covers most cases).                              |
| Event editing granularity                                                                | **Defer-indefinite** | `eventStartEditable`, `eventDurationEditable`, `eventResizableFromStart`, `eventProgressChangeable`, `eventInteractive`                                                                                                                                                                             | Lands when consumer needs per-edge / per-feature toggle beyond umbrella `editable`.                                         |
| Touch interactions (long-press)                                                          | **Defer-indefinite** | `longPressDelay`, `eventLongPressDelay`, `selectLongPressDelay`                                                                                                                                                                                                                                     | Lands when consumer reports touch-device interaction need.                                                                  |
| External HTML5 drag-in / drag-out                                                        | **Defer-indefinite** | `droppable`, `dropAccept`, `dragRevertDuration`, `dragScroll`, `allDayMaintainDuration`, `DropArg`, `EventReceiveArg`, `EventLeaveArg`                                                                                                                                                              | Lands when consumer needs cross-component drag.                                                                             |
| Time-bounds + slot config                                                                | **Defer-indefinite** | `slotMinTime`, `slotMaxTime`, `slotMinWidth`, `dayMinWidth`, `slotLabelInterval`, `slotLabelFormat`, `slotDuration` override, `nextDayThreshold`, `timeZone`, `locales` array                                                                                                                       | Lands with locale-driven / TZ-aware formatting phase or consumer time-bound clipping request.                               |
| Explicit-sizing props                                                                    | **Defer-indefinite** | `height`, `contentHeight`, `viewHeight`, `aspectRatio`, `expandRows`                                                                                                                                                                                                                                | Lands when consumer's container-driven CSS sizing is insufficient.                                                          |
| Day-header / day-cell customization (`dayHeader*`, `dayCell*`, day-relative CSS classes) | **Defer-indefinite** | `dayHeaders`, `dayHeaderFormat`, `dayHeader{ClassNames,Content,DidMount,WillUnmount}`, `dayCell{ClassNames,Content,DidMount,WillUnmount}`, `.gantt-day-disabled/past/future/other`, `.gantt-day-today` (paired with `todayBgColor` Phase 22.2)                                                      | Lands with per-day customization phase.                                                                                     |
| Slot-label / slot-lane customization                                                     | **Defer-indefinite** | `slotLabel{ClassNames,Content,DidMount,WillUnmount}`, `slotLane{ClassNames,Content,DidMount,WillUnmount}`                                                                                                                                                                                           | Lands when consumer needs per-tick customization (chronix `slotRegistry` would gain label/lane slot names).                 |
| Week-numbers column                                                                      | **Defer-indefinite** | `weekNumbers`, `weekNumberCalculation`, `weekNumber{ClassNames,Content,DidMount,WillUnmount,Format}`, `WeekNumberContentArg`, `WeekNumberMountArg`, `.gantt-week-number`                                                                                                                            | Lands when consumer needs week-number sidebar column.                                                                       |
| All-day events                                                                           | **Reject**           | 8 `allDay*` options, `AllDayContentArg`, `AllDayMountArg`, `defaultAllDay`, `defaultAllDayEventDuration`, `defaultTimedEventDuration`, `.gantt-bg-event`                                                                                                                                            | Chronix gantt is timed-only by design. Re-evaluation requires major redesign.                                               |
| Event sources / async fetch                                                              | **Defer-indefinite** | `events`, `eventSources`, `initialEvents`, `lazyFetching`, `startParam`, `endParam`, `timeZoneParam`, `eventSourceFailure`, `eventSourceSuccess`, `eventProcessCallback`, `refetchEvents`, `getEventSources`, `getEventSourceById`, `addEventSource`, `removeAllEventSources`, `EventSourceFuncArg` | (Already in disposition register as "Recurring events + event sources"; this row consolidates.)                             |
| Resource customization hooks                                                             | **Defer-indefinite** | `resourceLabel{ClassNames,Content,DidMount,WillUnmount}`, `resourceLane{ClassNames,Content,DidMount,WillUnmount}`, `ResourceLabelContentArg`, `ResourceLaneContentArg`, `ColHeaderContentArg`, `ColCellContentArg`, `resourceAdd/Change/Remove` emits, `addResource` etc API                        | (Already partially in disposition register; this row consolidates resource-side hooks.)                                     |
| Event truncation + popover infrastructure                                                | **Defer-indefinite** | `dayMaxEvents`, `dayMaxEventRows`, `eventMaxStack`, `slotEventOverlap`, `moreLink*` (6), `dayPopoverFormat`, `noEventsText`, `MoreLinkArg`, `MoreLinkContentArg`, `MoreLinkMountArg`, `.gantt-popover*`, `moreLinkBgColor`, `moreLinkTextColor`                                                     | Lands when consumer caps event display per day.                                                                             |
| Background events                                                                        | **Defer-indefinite** | `bgEventColor`, `bgEventOpacity`, `eventDisplay='background'`, `.gantt-bg-event`, `smallFontSize` (bg-event title font), `EventSegment` (multi-day slicing)                                                                                                                                         | Lands when consumer needs background-event rendering (shaded blocks behind regular events).                                 |
| Selection / range theming                                                                | **Defer-indefinite** | `highlightColor`, selection-rect theming, `neutralBgColor`, `neutralTextColor`                                                                                                                                                                                                                      | Lands when consumer needs themed selection overlay vs the current inline-colored rect.                                      |
| Hover-state button theming                                                               | **Defer-indefinite** | `buttonHoverBgColor`, `buttonHoverBorderColor`, `buttonActiveBorderColor`                                                                                                                                                                                                                           | Lands as visual polish when toolbar `:hover` / pressed-border tokens become important.                                      |
| Edge-resizer theming                                                                     | **Defer-indefinite** | `eventResizerThickness`, `eventResizerDotTotalWidth`, `eventResizerDotBorderWidth`, `.gantt-event-resizer-start/end` CSS classes                                                                                                                                                                    | Lands when consumer themes the resize-handle visual (chronix currently inline-styles).                                      |
| A11y hints                                                                               | **Defer-indefinite** | `viewHint`, `navLinkHint`, `closeHint`, `timeHint`, `eventHint`                                                                                                                                                                                                                                     | Lands when a11y story expands (chronix has basic `aria-pressed` only).                                                      |
| Per-view config override system (`views: { day: {...} }`)                                | **Defer-indefinite** | `views.<id>.{type,component,buttonTextKey,dateProfileGeneratorClass,classNames,content,didMount,willUnmount}`, inherited base-option overrides                                                                                                                                                      | Lands when consumer needs per-view customization (chronix has one canonical config per view).                               |
| Custom rendering meta + slot extension                                                   | **Defer-indefinite** | `handleCustomRendering`, `customRenderingMetaMap`, `customRenderingReplaces`                                                                                                                                                                                                                        | Lands when chronix `slotRegistry` gains beyond-bar slots.                                                                   |
| Imperative formatter / dynamic-option mutation                                           | **Defer-indefinite** | `formatDate`, `formatRange`, `formatIso`, `view` property, `setOption`, `getOption`, `updateSize`, `getAvailableLocaleCodes`                                                                                                                                                                        | Lands when consumer wants imperative formatter helpers (consumers can use `Intl.DateTimeFormat` directly today).            |
| Initial-scroll offset                                                                    | **Defer-indefinite** | `scrollTime`, `scrollTimeReset`                                                                                                                                                                                                                                                                     | Lands when consumer wants initial horizontal scroll offset (Phase 24's `scrollToTime` only covers programmatic post-mount). |
| Window resize handling                                                                   | **Defer-indefinite** | `handleWindowResize`, `windowResizeDelay`, `windowResize` emit                                                                                                                                                                                                                                      | Chronix uses Vue reactivity for prop changes; no explicit window-resize listener. Re-prioritize when needed.                |
| Weekends extended (granular)                                                             | **Defer-indefinite** | `hiddenDays`, `firstDay`, `fixedWeekCount`, `showNonCurrentDates`                                                                                                                                                                                                                                   | Chronix has umbrella `weekendsVisible` (Phase 18). Granular extensions land per consumer ask.                               |
| Event sizing constraints                                                                 | **Defer-indefinite** | `eventMinWidth`, `eventShortHeight`, `forceEventDuration`                                                                                                                                                                                                                                           | Visual polish; chronix has `barHeight` (Phase 5.x).                                                                         |
| Title / week / month format customization                                                | **Defer-indefinite** | `titleFormat`, `weekText`, `weekTextLong`, `monthStartFormat`, `rerenderDelay`                                                                                                                                                                                                                      | Lands with locale-driven / i18n title formatting phase.                                                                     |
| Network + lifecycle internals                                                            | **Reject**           | `online`, `_unmount` / `_beforeprint` / `_afterprint` / `_resize` / `_scrollRequest` / `_noEventDrop` / `_noEventResize` (k-ui-internal listeners)                                                                                                                                                  | k-ui-internal; not a public consumer surface.                                                                               |
| Hover / mouse callbacks                                                                  | **Defer-indefinite** | `eventMouseEnter`, `eventMouseLeave`, `EventHoveringArg`                                                                                                                                                                                                                                            | Consumer can wrap chronix in own event listeners. Re-prioritize if consumer needs first-class emit.                         |
| Per-instance recurring events                                                            | **Defer-indefinite** | `[data-instance-id]` attribute, recurrence rules                                                                                                                                                                                                                                                    | Tied to event-sources cluster (already deferred).                                                                           |

#### Uncataloged-but-done backfills (audit-sweep 2026-05-16)

Items chronix implemented but missed catalog rows. Officially recorded as DONE:

| Item                                                                                                    | Done in Phase    | Chronix name                                                      |
| ------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------- |
| `unselectAuto`                                                                                          | Phase 12         | `useGanttSelection({ unselectAuto })`                             |
| `eventContent` (partial)                                                                                | Phase 11         | `slotRegistry` (`BAR_SLOT_NAME = 'bar'`)                          |
| `themeOverrides`                                                                                        | Phase 10         | `theme` prop                                                      |
| `pageBgColor`                                                                                           | Phase 10         | `chartBackground` + `headerBackground` + `sidebarBackground`      |
| `borderColor` (umbrella → 6 chronix per-region tokens)                                                  | Phase 10         | `headerCellStroke` + 5 others                                     |
| `--gantt-header-text-color` (CSS-only)                                                                  | Phase 10         | `headerCellLabel` + `headerTickLabel`                             |
| `stickyHeaderDates`                                                                                     | Phase 4.5        | Sticky-header refactor (default-on, no consumer toggle)           |
| `locale`                                                                                                | Phase 1/2        | `AxisRangePlanInput.locale`                                       |
| `resources` (event source for resources)                                                                | Phase 1/5        | `rows: RowSpec[]` prop                                            |
| `dependencyLineStyle`                                                                                   | Phase 7/8        | `LinkSpec.routing` per-link                                       |
| `EventContentArg` (partial → 7 fields missing: isMirror/isStart/isEnd/isPast/isFuture/isToday/timeText) | Phase 11 partial | `BarSlotArgs` (extension Defer-indefinite for missing flags)      |
| `EventClickArg` (partial → 3 fields missing: el/view + jsEvent rename)                                  | Phase 12 partial | `BarClickPayload`                                                 |
| `EventDragStart/StopArg`                                                                                | Phase 16         | `BarDragStart/StopPayload`                                        |
| `EventDropArg` (revert() missing — chronix uses upstream validation gates)                              | Phase 3+         | `BarDropPayload`                                                  |
| `EventResizeStart/Stop/DoneArg`                                                                         | Phase 16/3+      | `BarResizeStart/Stop/Payload`                                     |
| `EventProgressStart/Stop/DoneArg`                                                                       | Phase 3.x        | `BarProgressPayload`                                              |
| `DateClickArg`                                                                                          | Phase 12         | `EmptyAreaClickPayload` (3 k-ui fields missing — minimal payload) |
| `DateSelectArg`                                                                                         | Phase 19         | `SelectPayload`                                                   |
| `on`/`off`/`trigger` API methods                                                                        | Phase 4+         | `handle.subscribe(event, listener)` (returns unsubscribe)         |
| `getEvents()` API                                                                                       | Phase 4+         | `handle.getBarTable()`                                            |
| `view` property                                                                                         | Phase 1+         | `axisInput` prop (reactive)                                       |
| `.gantt-scheduler` root class                                                                           | Phase 4.5/22     | `.cx-gantt-root` / `.cx-gantt-wrapper`                            |
| `.gantt-timeline-body-wrapper`                                                                          | Phase 4.5        | `.cx-gantt-wrapper`                                               |
| `.gantt-event`                                                                                          | Phase 4 entry    | `.cx-gantt-bar`                                                   |
| `[data-event-id]`                                                                                       | Phase 4 entry    | `[data-bar-id]`                                                   |
| `[data-resource-id]`                                                                                    | Phase 5.x        | `[data-row-id]`                                                   |
| `.gantt-event-progress-drag-triangle`                                                                   | Phase 3.x        | `.cx-gantt-progress-triangle`                                     |
| `.gantt-event-selected`                                                                                 | Phase 12         | `.cx-gantt-bar--selected`                                         |
| `.gantt-timeline-slot-label`                                                                            | Phase 4.7        | `.cx-gantt-tick-label`                                            |
| `.gantt-timeline-header-cell`                                                                           | Phase 4.9        | `.cx-gantt-header-cell`                                           |
| `.gantt-toolbar*` family (5 classes)                                                                    | Phase 22         | `.cx-gantt-toolbar*` family                                       |
| `.gantt-timeline-today-line`                                                                            | Phase 21         | `.cx-gantt-today-line` (+ `data-today-line-side`)                 |
| `.gantt-resource-area-header` / `.gantt-resource-area-body`                                             | Phase 14         | `.cx-gantt-sidebar-header` / `.cx-gantt-sidebar-body`             |
| `.gantt-resource-group-cell`                                                                            | Phase 5.x        | (chronix rowspan-merge; no dedicated class)                       |
| `.gantt-event-link`                                                                                     | Phase 8          | `.cx-gantt-link`                                                  |
| `.gantt-defs`                                                                                           | Phase 8          | `.cx-gantt-defs`                                                  |

#### Alias / variant names covered by the cluster rows above

The cluster rows fold many k-ui items by canonical name; for completeness the audit-sweep also covers these aliases and variant names that occasionally appear in k-ui code under slightly different identifiers:

- `EventResizeStartArg` / `EventResizeStopArg` — variant aliases for `EventResizeStartStopArg` (both argument forms exist in k-ui's exported types). Same disposition as the canonical form (⚠ done in chronix Phase 16 as `BarResizeStartPayload` / `BarResizeStopPayload`).
- `EventProgressStartArg` / `EventProgressStopArg` — variant aliases for `EventProgressStartStopArg`. Same disposition (⚠ done in chronix Phase 3.x).
- `EventReceiveLeaveArg` — union alias for `EventReceiveArg` / `EventLeaveArg`. Same disposition (Defer-indefinite within the external HTML5 drag-in / drag-out cluster).
- `viewClassNames` — third member of the `viewDidMount` / `viewWillUnmount` view-lifecycle hook cluster. Same disposition (Defer-indefinite within the day-header/cell + view-customization clusters).
- `nowIndicatorWillUnmount` — paired with `nowIndicatorDidMount`. Same disposition as the `nowIndicator` reject family.
- `eventAdd` / `eventRemove` — emit listeners paired with `eventChange`. Same disposition: covered by `EventAddArg` / `EventRemoveArg` arg-shapes' disposition row (Phase 24 imperative-API emits, alongside `addEvent` / `removeAllEvents` / `getEventById`).

### Counts after audit-sweep 2026-05-16

- **DONE since recheck**: 5 (unchanged — same items as before audit-sweep).
- **DONE-but-uncataloged (backfilled this sweep)**: 36 items recorded above.
- **Planned with phase number**:
  - Phase 22.1 (toolbar click recording-replay) — bundled
  - Phase 22.2 (todayLine default-ON + todayBgColor + `.gantt-day-today`) — **NEW**
  - Phase 22.AUTOMATE (catalog-completeness CI gate) — **NEW**, post-22.2
  - Phase 23 (sidebar dual-scrollport)
  - Phase 24 (imperative API + nav — scope expanded with `initialDate`, `initialView`, `dateIncrement`, `incrementDate`, `getDate`, `zoomTo`, `addEvent`/`removeAllEvents`/`getEventById`, `scrollToTime`, `removeAllEvents`)
  - Phase 25 (drag-distance gate — scope expanded with `selectMinDistance`)
- **Reject (by-design)**: 8 + audit-sweep adds (`now`, `themeSystem`, all-day cluster, k-ui-internal `_*` listeners) = ~12.
- **Defer-indefinite (revisit on demand)**: 21 + ~22 cluster rows from audit-sweep + ~7 individuals = ~50 total cluster/individual entries covering ~170 underlying k-ui items.

### Roadmap implications (historical — superseded 2026-05-16)

**⚠ This section was the original recheck's roadmap framing. The
Disposition register above supersedes it. Phase numbers 17-21 named
here are NOT the phases that actually landed (the actual Phase 17-21
were parity-helpers / weekendsVisible / validation / eventColor /
todayLine respectively). Kept for historical reference.**

If "全量对齐 k-ui" is the goal, the **17 P0 items + 9 P1 items = 26
items**. Each is roughly a phase-sized piece of work; conservatively
~26 phases × 4-6 hours each = **2-3 months of focused work** just to
close the **functional gap**. The P2 items (~8 items) add another
~1-2 weeks of polish if pursued.

For comparison: chronix is at ~10% coverage of k-ui's public surface
right now (18 ✅ + 16 🟡 = 34 of 171 items partially or fully
covered). Reaching 80%+ coverage is the bulk of the remaining work,
and that's where the rest of the 2-3 month estimate sits.

**Recommendation**: rather than re-doing parity probes ad-hoc per
phase, add a **side-by-side parity assertion to `tooling/golden-
runner/tests/parity.spec.ts` per new phase**. Specifically:

1. Restore the discipline: every new feature in chronix that
   corresponds to a k-ui surface item gets a parity assertion in the
   same commit that lands the feature.
2. The assertion can be a Playwright-driven `expect(chronixDom).
toMatchKuiDom(scenarioId)` helper (yet to be written) that takes a
   demo scenario id, mounts both demos with the same inputs, and
   diffs the observable outputs.
3. The 5 chronix VRT baselines are not enough — VRT catches pixel
   diffs in the captured demo states; it doesn't catch algorithmic
   drift in code paths the demo doesn't exercise.

Items in the **P0** list should be triaged for the next phases. The
recommended next slate (in dependency order):

1. **Phase 17 — Demo input-shape compat**: `eventDataTransform` so
   the k-ui demo's event shape can drop into chronix without manual
   re-mapping. Unblocks fair-comparison parity tests.
2. **Phase 18 — Validation callbacks**: `eventAllow` / `selectAllow`
   / `eventOverlap` / `eventConstraint`. Small additive surface;
   blocks any drag/resize that should be vetoed.
3. **Phase 19 — Event color pipeline**: `eventColor` / `eventBackgroundColor`
   / `eventBorderColor` / `eventTextColor` (4 props + 3 callbacks).
   Visible parity for the demo.
4. **Phase 20 — Today-line + now-indicator**: `todayLine` + `nowIndicator`
   plus 4 render hooks. Both are render-additive; closes the demo's
   visible toggle parity.
5. **Phase 21 — `weekendsVisible` actually filtering**: 🔴 P0 fix
   from Batch 1.

After those, the **toolbar (#22)** and **handle imperative API
(addEvent / scrollToTime / changeView impl / prev / next / today /
gotoDate)** are the next big slices.
