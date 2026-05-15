# Phase 21 — todayLine (nowIndicator deferred indefinitely)

**Status**: **DONE (2026-05-16)**. Landed as 4 commits: `55e7c97`
(design doc, 372 lines) → `9cde7e0` (audit-only side commit promoting
sidebar dual-scrollport drift to Phase 23) → `6959592` (Commit 1: API

- theme tokens + adapter render + 8 SFC tests, ~360 LOC) → `3ba2f49`
  (Commit 2: demo flag + 2 vrt scenarios + cross-demo parity assertion
- 2 baselines, ~139 LOC). vitest 436 → 445 (+9); parity assertions 27
  → 28 (+1 today-line cross-demo, **day-1 pixel-perfect: kui=480.00
  chronix=480.00 Δ=0.00**); cross-demo scenarios 25 → 27 (gate 27/27 =
  15 vrt real-green + 12 cross test.fail-passing pending Phase 20.7.1).
  `/phase-close` walked 7/7 green. See `audit/journal/2026-05-13.md`
  "Phase 21" section for the infrastructure ROI assessment (partial:
  demo + cross-demo infrastructure delivered; DOM parity single-element
  extractor still missing).

## Problem

`packages/gantt/src/api/gantt-options.ts:72` lists `todayLine` as a
v1-deferred option. The 12 existing `kind: 'cross'` cross-demo
scenarios (Phase 20.7) currently `test.fail()`-pass with a uniform
1-px width / 3-px height dimension mismatch — k-ui renders a
today-line in its default state, chronix does not. Until chronix
draws the line, the rendered-content layer cannot match k-ui even
after Phase 20.7.1 fixes the body-region dimension mismatch.

Phase 21 also serves as the **first concrete test of the past 3
infrastructure phases** (20.5 / 20.6 / 20.7). The ROI claim was that
each feature phase would add:

- ~5 LOC of DOM-level parity assertion (via 20.5's snapshot helpers)
- 1-3 lines of demo toggle (via 20.6's URL config layer)
- 1-3 new cross-demo scenarios (via 20.7's registry)

If Phase 21 actually lands in those LOC budgets, the infrastructure
acceleration is real. If it requires going back to expand 20.5
helpers or extend 20.7 registry plumbing, then the infrastructure
needs sharpening before Phase 22.

**nowIndicator is explicitly NOT in this phase** — per user direction.
The k-ui `nowIndicator` feature pulls in a 5-min `setTimeout` state
machine + tab-visibility integration + custom-content render hooks.
Static today-line alone covers the visible-default-state parity gap
without that complexity.

## Reference (k-ui) behavior surface — full catalog

Source: k-ui `packages/gantt/src/resource-timeline/GanttView.tsx:1110-1303`

- `options-refiners.ts:8-13` + demo `DemoApp.vue:1642-1661`.

| Item                                                                                                    | k-ui behavior                                                                                                   | chronix v0 disposition                                                                                                               | Reason                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `todayLine` option type                                                                                 | `{ color?, width?, tooltip?, style? } \| false`                                                                 | ✅ port — same shape                                                                                                                 | Matches k-ui's surface so a future codemod migrating users can rename only.                                                                                                      |
| Default visibility                                                                                      | Demo enables by default with `color='#ff6b6b'`, `width=2`, `style='dashed'`, `tooltip='今日'`                   | ✅ port — same defaults, but **opt-in at the API** (default = `false`); demo turns it **on** in parity mode                          | Decision C below.                                                                                                                                                                |
| X-position computation                                                                                  | `dateToCoordTimeline(today, profile, width, slotWidths, slotXPositions)` — precise px math                      | ✅ port — chronix uses `(todayMs - axisStartMs) * pxPerMs`, the same formula bar-placement-pass uses for bar positions               | Single source of truth means today-line lines up with bar baselines pixel-exactly.                                                                                               |
| Off-axis handling                                                                                       | Returns `null` if today is outside the axis range                                                               | ✅ port — same null return                                                                                                           | Avoids painting outside the body wrapper.                                                                                                                                        |
| Position frame                                                                                          | Body: `position: absolute` div anchored at `left: x`, full height. Header: same.                                | ✅ port — chronix renders as `<line>` in both `svg.cx-gantt-header` and `svg.cx-gantt-body` (full SVG height each)                   | SVG-native chronix doesn't need the `position: absolute` div.                                                                                                                    |
| Style: solid/dashed/dotted/double/dashed-dot                                                            | 5 CSS border-style values + 1 SVG pattern fallback                                                              | ✅ port — chronix maps `solid` → no `stroke-dasharray`, `dashed` → `6 4`, `dotted` → `2 3`. **`double` + `dashed-dot` parked v0**    | `double` is a CSS-border idiom that doesn't translate cleanly to SVG; `dashed-dot` is uncommon. Parked for follow-up if user demand surfaces.                                    |
| Color override                                                                                          | `color` prop, default `'#ff6b6b'`                                                                               | ✅ port — same default + prop                                                                                                        | Direct port.                                                                                                                                                                     |
| Width override                                                                                          | `width` prop, default `2`                                                                                       | ✅ port — maps to SVG `stroke-width`                                                                                                 | Direct port.                                                                                                                                                                     |
| Tooltip widget                                                                                          | `<div class="gantt-timeline-today-line-tooltip">` floating in header band, `zIndex: 4`, text = `tooltip` option | ✅ port — chronix renders `<rect>` + `<text class="cx-gantt-today-line-tooltip">` group at top of header SVG, `pointer-events: none` | Per Decision A — keep tooltip in v0 since k-ui's default visibility includes it, so cross-demo parity needs it.                                                                  |
| Z-order                                                                                                 | k-ui: `zIndex: 1.5` (above grid lines, below bars-with-explicit-z)                                              | ✅ port — chronix renders the today-line **before** bars in the SVG (DOM order = paint order), so bars paint on top                  | Bars-on-top is the more useful overlap (bar text should be readable across the line).                                                                                            |
| Demo toggles (color, width, style, tooltip text live edit)                                              | 4 demo controls                                                                                                 | ⏸️ parked — demo lands ONE URL flag `todayLine=true/false` only; live color/style editing skipped                                    | Stays within "1-3 lines of demo toggle" budget per acceleration constraint #2. Live-edit color is a 4-toggle demo expansion that doesn't add parity value.                       |
| `nowIndicator` (option + timer + custom content)                                                        | Full 5-min setTimeout state machine + tab-visibility + render hooks                                             | ❌ rejected v0 — per user direction                                                                                                  | Static today-line covers the visible-default parity gap. Live updates at midnight rollover or sub-second `now` mark deferred indefinitely unless a future phase declares a need. |
| `nowIndicatorSnap`, `nowIndicatorContent`, `nowIndicatorClassNames`, `nowIndicatorDidMount/WillUnmount` | Custom render hooks                                                                                             | ❌ rejected v0                                                                                                                       | Tied to `nowIndicator` — also dropped.                                                                                                                                           |

## Approach

### API surface

```ts
// packages/gantt/src/api/gantt-options.ts — add to GanttOptions:

export interface TodayLineOption {
  /** Hex / rgb / CSS color. Default '#ff6b6b'. */
  readonly color?: string;
  /** SVG stroke-width in px. Default 2. */
  readonly width?: number;
  /** Stroke pattern. Default 'dashed'. */
  readonly style?: 'solid' | 'dashed' | 'dotted';
  /** Header tooltip text. Default '今日'. Set to '' to suppress. */
  readonly tooltip?: string;
}

export interface GanttOptions {
  // ... existing fields
  /**
   * Vertical line marking "today" on the timeline. Pass `false` (or
   * omit) to hide. The line renders at the same x-coordinate as a
   * bar starting at `new Date()` would have — uses the same
   * pxPerMs math as the bar-placement pass for guaranteed alignment.
   *
   * Today is sampled at render time (not via a setTimeout / visible-
   * change listener); if the chart stays mounted across midnight the
   * line will not auto-advance until the next reactive re-render.
   * Live-update / nowIndicator support deferred indefinitely.
   */
  readonly todayLine?: TodayLineOption | false;
}
```

### Layout / position math

No core layout change. Adapter computes `todayX` at render time:

```ts
// adapters/vue3/src/chronix-gantt.ts — inside the render setup
const axisStartMs = axis.ticks[0]?.time.getTime() ?? 0;
const pxPerMs = axis.slotWidth / axis.slotDurationMs;
const todayX = (Date.now() - axisStartMs) * pxPerMs;
const todayLineVisible =
  props.todayLine !== false &&
  props.todayLine !== undefined &&
  todayX >= 0 &&
  todayX <= axis.totalWidth;
```

When `todayLineVisible`, emit:

- Body SVG: `<line class="cx-gantt-today-line" x1={x} x2={x} y1={0} y2={bodyHeight} stroke={color} stroke-width={width} stroke-dasharray={pattern} />`
- Header SVG: same line element + (if `tooltip` non-empty) a `<g class="cx-gantt-today-line-tooltip">` group with `<rect>` background + `<text>` label, positioned at the top of the header band centered horizontally on `x`.

Stroke-dasharray mapping:

- `'solid'` → `undefined` (no dash attr)
- `'dashed'` → `'6 4'`
- `'dotted'` → `'2 3'`

### Default values

Per `TodayLineOption`:

- `color: '#ff6b6b'`
- `width: 2`
- `style: 'dashed'`
- `tooltip: '今日'`

To enable: pass `todayLine: true` (resolves to all defaults) OR `todayLine: { color: '#3b82f6' }` (per-field override). To hide: pass `todayLine: false` or omit.

Wait — `todayLine: true` doesn't typecheck against `TodayLineOption | false`. Fix: accept `true` as sugar for "use all defaults", normalize to `TodayLineOption` internally:

```ts
readonly todayLine?: TodayLineOption | boolean;
// (false = hide, true = all defaults, object = explicit override)
```

### Adapter integration

The `chronix-gantt.ts` SFC adds:

- 1 prop binding (`todayLine`)
- ~30 LOC of render-pass conditional (compute x, emit line + tooltip)
- 0 changes to existing bar / link / header / sidebar render paths

### Demo integration (Phase 20.6 URL-config layer)

`examples/gantt-vue3/src/App.vue` adds 1 schema entry:

```ts
const DEMO_SCHEMA = {
  // ... existing entries
  todayLine: bool(
    false,
    'Show today-line (uses k-ui defaults: red #ff6b6b, 2px, dashed, 今日 tooltip)',
  ),
} as const;
```

And in the parity-mode auto-enable block:

```ts
const activeTodayLine = computed<TodayLineOption | false>(() => {
  if (cfg.parity.value) return {}; // k-ui defaults — matches reference
  if (cfg.todayLine.value) return {};
  return false;
});
```

In template: `<ChronixGantt :today-line="activeTodayLine" ... />`.

### Theme tokens (Phase 10 alignment)

Phase 10 established `chronix-theme.ts` as the CSS-variable surface.
Add 2 tokens (matching k-ui's defaults):

- `--cx-today-line-color: #ff6b6b`
- `--cx-today-line-tooltip-bg: #ff6b6b`

The `color` option still works (per-prop override wins); the tokens
exist so theme-only customization is possible without per-call prop
overrides.

## Parity assertion plan — MANDATORY

Per Phase 20.5 + 20.7 infrastructure, Phase 21 contributes:

### DOM-level parity (1 new `parity.spec.ts` assertion)

| Assertion id                    | Drives k-ui via                                                    | Drives chronix via                                                                                                    | Compares                                                                                                                                             | Tolerance                  |
| ------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `todayLine x-coordinate parity` | `loadBothDemos` → k-ui at 8701 (todayLine enabled by demo default) | `loadBothDemos` → chronix at 8702 with `?parity=true` (chronix's parity-mode enables todayLine via `activeTodayLine`) | Extracts `<line class="cx-gantt-today-line">` x1 (chronix) vs `<div class="gantt-timeline-today-line">` `left` (k-ui), both relative to body wrapper | x: 1 px (Phase 17 default) |

Implementation: inline `chart.evaluate(...)` in `parity.spec.ts` —
~10 LOC because the today-line is a single element per demo, no
dedup / pairing needed. Not worth a generic `extractTodayLineSnapshot`
helper in `parity-helpers.ts` until a second decoration phase
(grid-cell highlights? selection ribbons?) needs the same shape.

### Cross-demo screenshot diff (2 new `CROSS_DEMO_SCENARIOS` entries)

| #   | id                       | kind | view | URL flags        | Why                                                                                                                                                                 |
| --- | ------------------------ | ---- | ---- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 26  | `vrt-week-todayLine`     | vrt  | week | `todayLine=true` | Chronix-only opt-in scenario (non-parity mode). Distinct from `cross-week-default` which captures todayLine in parity-mode. Tests that the standalone toggle works. |
| 27  | `vrt-view-day-todayLine` | vrt  | day  | `todayLine=true` | todayLine × day view (1 single full-height day axis). Tests that the line still renders in the densest axis case.                                                   |

No new `kind: 'cross'` scenarios — k-ui's URL doesn't expose a
`todayLine=false` switch, so a "today-line-off cross" scenario can't
match k-ui state. The existing 12 cross scenarios continue to
`test.fail()`-pass; Phase 21 likely doesn't flip them green (the
1-px width / 3-px height dimension mismatch tracked as Phase 20.7.1
is the dominant fail mode, not today-line absence). If any of the
12 unexpectedly flips to green-passing, Playwright reports "Expected
to fail, but passed" — handled by the `/phase-close` step 6.5 doc
(remove the test.fail mark, close the relevant follow-up).

### Existing scenarios that need re-capture

When chronix enables todayLine in parity mode, the **runtime** chronix
rendering changes. Affected by re-capture decision:

- 13 existing `kind: 'vrt'` baselines: chronix-only, NOT parity-mode →
  todayLine stays off → baselines **unchanged**.
- 12 existing `kind: 'cross'` baselines: those are k-ui-side PNGs →
  baselines **unchanged**.
- 2 new `vrt-*-todayLine` baselines: captured fresh in this phase.

So `pnpm cross-demo-capture` only writes 2 new PNGs; the existing 25
are untouched.

## Test coverage

- **core** (`packages/gantt/src/api/`): no new core code (`TodayLineOption`
  type lives in `gantt-options.ts`; resolution / normalization is
  adapter-side because today is sampled at adapter render time).
  Type-level only — no unit tests required.
- **adapter** (`adapters/vue3/src/chronix-gantt.test.ts`): +4-6 SFC tests
  - renders `<line class="cx-gantt-today-line">` when `todayLine={}` and today is in axis range
  - does NOT render when `todayLine === false` (default)
  - does NOT render when today is outside the axis range
  - applies `color` / `width` props to SVG attributes
  - applies `stroke-dasharray` for each of `solid` / `dashed` / `dotted`
  - tooltip group renders only when `tooltip` is non-empty string
- **demo** (`examples/gantt-vue3/src/demo-config.test.ts`): +1 test (new
  `todayLine` schema field round-trips through URL).
- **parity** (`tooling/golden-runner/tests/parity.spec.ts`): +1 cross-demo
  assertion (todayLine x-coordinate).
- **cross-demo verify** (`tooling/golden-runner/tests/cross-demo.spec.ts`):
  +2 vrt scenarios via registry edit only (no spec file change).

**Cumulative test count after Phase 21**:

- vitest: 436 → ~440 (+4-5 SFC + 1 demo-config = ~5 new vitest)
- parity.spec.ts: 27 → 28 assertions
- cross-demo scenarios: 25 → 27 (still 12 cross + 13+2=15 vrt)
- golden-runner Playwright unit tests: 32 unchanged (registry-shape tests count to 25 → 27 entries automatically; no new unit tests needed)

## VRT impact

- Existing 5 chronix VRT baselines (`goldens/chronix-*.png`): chronix-VRT
  scenarios are chronix-only without parity mode, so `todayLine`
  defaults `false` → **no change**.
- Existing 6 k-ui parity goldens: k-ui side unchanged → **no change**.
- 12 cross-demo k-ui baselines: k-ui side unchanged → **no change**.
- 13 chronix-vrt cross-demo baselines: chronix's default mode (non-parity)
  has `todayLine: false` → **no change**.
- 2 new `vrt-*-todayLine` baselines: captured in this phase.

## Execution plan — 2 commits + wrap-up

### Commit 1: `feat(gantt): todayLine option + adapter render + theme tokens (Phase 21)`

- `packages/gantt/src/api/gantt-options.ts`: add `TodayLineOption` interface + `todayLine?: TodayLineOption | boolean` field to `GanttOptions`. Re-export from `index.ts`.
- `packages/gantt/src/api/chronix-theme.ts`: add `--cx-today-line-color` + `--cx-today-line-tooltip-bg` tokens with k-ui-matching defaults.
- `adapters/vue3/src/chronix-gantt.ts`: prop binding + ~30 LOC render-pass conditional emitting `<line>` in body + header SVG, plus tooltip group in header SVG.
- `adapters/vue3/src/chronix-gantt.test.ts`: +4-6 SFC tests covering visibility, props, dash-pattern, tooltip toggle.
- Browser-verify: `pnpm --filter @chronixjs/example-gantt-vue3 dev` → open `http://localhost:8702/?todayLine=true` (after Commit 2 lands the demo flag) — for Commit 1's verification, manually pass `todayLine: { }` to `<ChronixGantt>` via a one-line demo edit, confirm visible.

### Commit 2: `feat(example-gantt-vue3): todayLine demo flag + parity-mode auto-enable + 2 vrt scenarios + parity assertion (Phase 21)`

- `examples/gantt-vue3/src/App.vue`: 1 schema entry + `activeTodayLine` computed + template prop binding.
- `examples/gantt-vue3/src/demo-config.test.ts`: +1 round-trip test for `todayLine` schema field.
- `tooling/golden-runner/src/cross-demo-scenarios.ts`: +2 vrt entries (`vrt-week-todayLine` + `vrt-view-day-todayLine`).
- `tooling/golden-runner/tests/cross-demo-scenarios.unit.spec.ts`: update the registry-count assertion (25 → 27, 13 vrt → 15 vrt).
- `tooling/golden-runner/tests/parity.spec.ts`: +1 assertion for today-line x-coordinate parity using `loadBothDemos` + inline `chart.evaluate`.
- Run `pnpm cross-demo-capture` for the 2 new scenarios only (existing 25 baselines untouched).
- Verify: `pnpm cross-demo-verify` → 27 scenarios pass (15 vrt real-green + 12 cross test.fail()-passing).
- Browser-verify: `http://localhost:8702/?todayLine=true` shows dashed red line at today's x.

### Commit 3 (wrap-up — REQUIRES `/phase-close` invocation)

- Journal Phase 21 section (6 mandatory sub-sections).
- Memory bump (test count + Phase 21 status).
- Status flip → DONE.
- /phase-close walks 7 gates including step 6.5 cross-demo-verify.

## Estimated scope

- Option type + theme tokens: ~30 LOC (~15 min)
- Adapter render conditional (line + tooltip): ~70 LOC (~1 h)
- Adapter SFC tests (4-6): ~80 LOC (~45 min)
- Demo schema + computed + template + test: ~25 LOC (~15 min)
- Cross-demo scenarios (2 entries + unit test counter bump): ~20 LOC (~10 min)
- parity.spec.ts assertion: ~30 LOC (~20 min)
- 2 new vrt baseline capture + visual sanity check: ~10 min
- Wrap-up + `/phase-close`: ~30 min
- **Total: ~3.5 hours focused work, ~265 LOC. Single session.**

This is **smaller than recent infrastructure phases** (Phase 20.5: 4h /
~600 LOC; Phase 20.7: 6h / ~500 LOC) because Phase 21 is genuinely a
single-feature phase that consumes the infrastructure rather than
building more of it. **If actual delivery is in this neighborhood, the
infrastructure acceleration is validated.**

## Open questions for the user — 3 load-bearing decisions

### Decision A — Tooltip widget in v0

**Recommended: include the tooltip group.**

k-ui's demo default renders a `<div class="gantt-timeline-today-line-tooltip">`
("今日" label in red background) floating at the top of the header
band. Including it adds ~30 LOC + 2 SFC tests + 1 theme token.

- **Include**: chronix's parity-mode rendering matches k-ui's full
  default visible state → existing 12 `test.fail()`-passing cross
  scenarios get closer to green when Phase 20.7.1 (dimension fix)
  lands. Also: the tooltip is k-ui's standard surface; dropping it
  would create a chronix-only API regression.
- **Skip**: today-line alone is the "core" feature; tooltip is a
  decoration. ~30 LOC + 2 tests saved. Cross-demo scenarios still
  benefit from the line itself. Defer tooltip to a follow-up.

### Decision B — `'double'` + `'dashed-dot'` styles

**Recommended: park, support only `'solid' | 'dashed' | 'dotted'` in v0.**

k-ui supports 5 styles: `solid`, `dashed`, `dotted`, `double`,
`dashed-dot`. `double` is a CSS-border idiom (two parallel lines); SVG
has no direct equivalent — would need two `<line>` elements offset
by `width + 1`. `dashed-dot` requires a custom dash pattern (`8 4 2
4`). Both are uncommon.

- **Park** (recommended): chronix supports `solid` / `dashed` /
  `dotted`. Users wanting `double` / `dashed-dot` in v0 work around
  with custom rendering. Type signature accepts only the 3 supported
  values so calling with `double` is a TypeScript error.
- **Port all 5**: adds ~20 LOC + 2 SFC tests for the niche patterns.
  Probably never used in practice.

### Decision C — Default API state: opt-in or opt-out

**Recommended: opt-in at the API level (`todayLine` defaults to `false`),
but the demo's parity mode automatically enables it to match k-ui's
default rendering.**

k-ui's library: opt-in (`todayLine: false` default in options.ts:321,
demo turns it on). k-ui's demo: on with full defaults. So chronix has
two natural choices for the LIBRARY default:

- **Opt-in** (recommended): chronix users get a "clean" gantt by
  default (no surprising red line). They explicitly enable
  `:today-line="true"` when wanted. Demo's parity-mode auto-enables
  via `activeTodayLine` so cross-demo screenshots match k-ui's
  rendered default. This is the safer library-API choice.
- **Opt-out** (default-on): every chronix user sees the red line by
  default. Matches k-ui's demo default but diverges from k-ui's
  library default. Could surprise existing chronix consumers.

---

Reply **按照推荐继续** to accept all three recommended defaults
(include tooltip, support 3 styles only, opt-in API + demo auto-enable
in parity mode) and proceed to commit the design doc + start Commit 1.
