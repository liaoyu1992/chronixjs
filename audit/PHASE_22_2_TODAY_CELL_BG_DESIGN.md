# Phase 22.2 — todayLine default-ON + todayBgColor

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

Two related visible-parity gaps the user reported on 2026-05-16:

1. **`todayLine` is implemented (Phase 21) but the chronix demo defaults OFF** (`cfg.todayLine = false`), while the parity-reference demo defaults ON. Same render code; just a default-value mismatch.
2. **`todayBgColor`** — k-ui's yellow today-column tint via CSS variable `--gantt-today-bg-color: rgba(255, 220, 40, .15)` painted on every `.gantt-day-today` cell. **Chronix has no equivalent** (silent-gap, found by audit-sweep 2026-05-16; now Planned Phase 22.2 in `PARITY_RECHECK.md`).

Both ship together because they share the rendering pathway (today's x-coordinate already computed in Phase 21's adapter for the line; reuse it for the cell rect).

## Reference (k-ui) behavior surface — full catalog

Reference files audited:

- `d:/work/k-ui/packages/gantt/src/theme/GlobalThemeOverrides.ts:81` — `todayBgColor?: string` typed surface
- `d:/work/k-ui/packages/gantt/src/theme/applyThemeOverrides.ts:32` — option-name → CSS variable map (`todayBgColor → --gantt-today-bg-color`)
- `d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:1339` — demo wires `todayBgColor: 'rgba(255, 220, 40, .15)'`
- `d:/work/k-ui/packages/gantt/src/**/*.css` — `.gantt-day-today` CSS class applies the `var(--gantt-today-bg-color)` fill to today's column cells

| Item                                                                                | k-ui          | chronix v0     | Reason                                                                                                            |
| ----------------------------------------------------------------------------------- | ------------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `todayBgColor` theme token → CSS variable                                           | ✅            | ✅ port        | New chronix `todayCellBgColor` theme token; default matches `rgba(255, 220, 40, .15)`.                            |
| `.gantt-day-today` CSS class applying the tint                                      | ✅            | ✅ port        | New chronix `.cx-gantt-today-cell` class on the `<rect>` element drawing the tint.                                |
| Column span: full timeline body height × one-day-slot width                         | ✅            | ✅ port        | Adapter renders `<rect>` at `todayX`, `width=oneDayPx`, `height=bodyHeight`; same in header band.                 |
| Header band also tinted (above the bar area, behind tick labels)                    | ✅            | ✅ port        | Header SVG also gets a sibling `<rect>` at `todayX`, header-band height.                                          |
| Day-view behavior: today's entire 24-hour view tinted                               | ✅            | ✅ port        | When `viewId === 'day'`, today's slot IS the whole chart width — the rect spans the full timeline.                |
| Per-view configurability (different colors per view)                                | ❌            | ⏸️ parked      | k-ui doesn't expose per-view; just the global token. Per-view override is `views: {}` cluster (Defer-indefinite). |
| `todayLine` default-ON in demo                                                      | ✅ (demo)     | ✅ port (demo) | Flip `cfg.todayLine.default` from `false` to `true` in `App.vue:79-82`.                                           |
| `todayCellBg` default-ON in demo                                                    | ✅ (demo)     | ✅ port (demo) | Wire `<ChronixGantt :today-cell-bg="true">` in App.vue.                                                           |
| Hidden-weekend handling: today-tint suppressed when today falls on a hidden weekend | ✅ (implicit) | ✅ port        | Reuse Phase 21's `resolvedTodayLine` x-coord null check (already handles `weekendsVisible=false` cases).          |

All 9 items ported. No parking.

## Approach

### New API surface

```ts
// packages/gantt/src/api/gantt-options.ts — sibling to TodayLineOption
export interface TodayCellBgOption {
  /** Fill color for the today-column tint. Defaults to theme.todayCellBgColor. */
  readonly color?: string;
}

// adapters/vue3/src/chronix-gantt.ts — new prop
todayCellBg: {
  type: [Boolean, Object] as PropType<TodayCellBgOption | boolean>,
  default: false,
},
```

Same prop shape as `todayLine` for ergonomic consistency.

### New theme token (1 addition)

```ts
// packages/gantt/src/api/chronix-theme.ts — append to existing Today line block
/** Fill for the today-column background tint. Default rgba(255, 220, 40, .15) matches the parity-reference. */
readonly todayCellBgColor: string;

// defaultChronixTheme adds:
todayCellBgColor: 'rgba(255, 220, 40, .15)',
```

`chronix-theme.test.ts`'s `EXPECTED_TOKEN_KEYS` + `stringKeys` arrays bump by 1.

### Render — adapter inline (no new pass)

Phase 21 already computes `resolvedTodayLine.x` per render. Reuse:

- **Body SVG**: prepend a `<rect class="cx-gantt-today-cell" x={todayX} width={oneDayPx} height={bodyHeight} fill={resolvedColor}>` BEFORE the bars `<g>` so bars render on top.
- **Header SVG**: same pattern, full header-band height. Behind tick labels but above the header background.

`oneDayPx` = `pxPerMs × MS_PER_DAY`. In `day` view, today's slot is 24 hours = full chart width.

### Default-ON in demo

`examples/gantt-vue3/src/App.vue`:

```ts
// Phase 22.2 — default ON to match parity-reference's visible default
todayLine: bool(true, 'Show vertical today-line (default ON matching parity-reference)'),
todayCellBg: bool(true, 'Show today-column background tint (default ON matching parity-reference)'),
```

Existing URL flag still works (`?todayLine=false` to disable).

### Alternatives considered + rejected

- **Single combined option** `today: { line?, cellBg? }`: rejected — k-ui keeps `todayBgColor` separate from `nowIndicator`/`todayLine`; following the same separation makes drop-in clearer.
- **CSS variable approach** (consumer sets `--cx-gantt-today-cell-bg`): rejected — chronix theme system is JS-prop-based (Phase 10 catalog), not CSS-var-based. Consistent with existing tokens.
- **Default ON in core (not just demo)**: rejected — k-ui's core defaults are OFF too; demo turns it on. Same model.

## Parity assertion plan — MANDATORY

| Assertion id (in parity.spec.ts)            | Drives k-ui demo via                                                       | Drives chronix demo via                                                                                   | Compares                                                                                                                 | Tolerance                                           |
| ------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `today-cell-bg presence parity (week view)` | `loadBothDemos` → k-ui at 8701 (default render renders `.gantt-day-today`) | `loadBothDemos` → chronix at 8702 with `?parity=true` (auto-enables today-cell-bg via parity-mode wiring) | Both demos render a non-zero bbox `today-cell` element at the same x-coordinate (within 1px) and same width (within 1px) | `x: 1px, width: 1px, y: Infinity, height: Infinity` |

1 new parity assertion; cumulative 31 → **32**.

## Test coverage

- adapter SFC: `adapters/vue3/src/chronix-gantt.test.ts` — `describe('Phase 22.2 todayCellBg')` (~6 tests):
  - rendered when `todayCellBg: true`
  - not rendered when `todayCellBg: false` (default)
  - color from `TodayCellBgOption.color` prop overrides theme token
  - falls back to `theme.todayCellBgColor` when color is unset
  - body + header rects both render
  - x-coordinate matches today-line x (reuses Phase 21 math)
- parity: `tooling/golden-runner/tests/parity.spec.ts` — +1 cross-demo assertion (see Parity assertion plan above).
- demo: no new test (default-on flip is a 1-line change to existing `cfg.todayLine`/`cfg.todayCellBg` schema).

## VRT impact

15 chronix cross-demo baselines need re-capture (body SVG now includes the today-cell rect; chronix-self baselines were captured pre-Phase-22.2 without it). Some k-ui-baseline cross scenarios may now align BETTER with chronix (both sides render today-cell tint at same position). 5 chronix VRT (Phase 4.4 originals) + 17 chronix-visual baselines unchanged (those don't include today markers in scope).

## Execution plan — 2 commits + wrap-up

### Commit 1: `feat(gantt): todayCellBg option + theme token + render (Phase 22.2)`

- `packages/gantt/src/api/gantt-options.ts`: new `TodayCellBgOption` interface, exported via `api/index.ts` + root `index.ts`
- `packages/gantt/src/api/chronix-theme.ts`: +1 `todayCellBgColor` theme token, default `'rgba(255, 220, 40, .15)'`
- `packages/gantt/src/api/chronix-theme.test.ts`: bump key arrays (+1)
- **dist rebuild**: `pnpm --filter @chronixjs/gantt build`
- `adapters/vue3/src/chronix-gantt.ts`: new `todayCellBg` prop, body + header `<rect class="cx-gantt-today-cell">` render
- `adapters/vue3/src/chronix-gantt.test.ts`: +6 SFC tests in `describe('Phase 22.2 todayCellBg')`
- **Anti-regression**: existing 267 core + 205 adapter + 11 demo vitest stay green

### Commit 2: `feat(example-gantt-vue3): default-ON todayLine + todayCellBg + 1 parity assertion (Phase 22.2)`

- `examples/gantt-vue3/src/App.vue`: flip `todayLine` default `false → true` + add `todayCellBg: bool(true, ...)` schema entry + wire `:today-cell-bg`
- `tooling/golden-runner/tests/parity.spec.ts`: +1 today-cell-bg parity assertion
- `audit/KUI_SURFACE_BASELINE.json` — no change (baseline already includes `todayBgColor` + `.gantt-day-today`; Phase 22.2 just promotes them from Defer/Planned to DONE)
- 15 chronix cross-demo baselines re-captured via `pnpm --filter @chronixjs/golden-runner cross-demo-capture --grep "vrt-"`
- **Cross-demo verify**: 27/27 green

### Commit 3 (wrap-up — REQUIRES `/phase-close` invocation)

- Journal Phase 22.2 section
- Memory bump (test count + phase status)
- Status flip → DONE
- Update PARITY_RECHECK disposition register: `todayBgColor` row → `DONE Phase 22.2`

## Estimated scope

- Theme token + types + export: ~30 min
- Adapter render (body + header rects): ~45 min
- SFC tests (~6): ~45 min
- Demo wiring (default-on flip + new schema entry): ~15 min
- Parity assertion + extraction inline (or new helper if pattern emerges): ~30 min
- VRT re-capture: ~10 min
- Wrap-up + `/phase-close`: ~20 min
- **Total: ~3.5 hours**, ~280 LOC + 15 baseline updates

## Open questions for the user

Three load-bearing decisions (per `feedback_quality_acceleration.md`):

1. **Naming: `todayCellBg` (chronix-prefixed by feature) vs `todayBgColor` (k-ui-name verbatim)?** Recommend **`todayCellBg`**. Reasoning: chronix's existing `todayLine` option uses the feature prefix (`todayLine` not `todayBgLine` or similar). Symmetric naming. Theme token `todayCellBgColor` matches `todayLineColor` precedent.

2. **Default-ON location: core defaults (`<ChronixGantt todayLine>` defaults true) vs demo defaults only (App.vue's `cfg.todayLine.default = true`)?** Recommend **demo only**. Reasoning: k-ui's core defaults are OFF too — the parity reference's `<KGanttScheduler>` doesn't auto-enable; the demo wires it explicitly. Mirroring that keeps drop-in users' surprise-on-mount minimal.

3. **Render order: today-cell BEFORE bars (z-order behind) vs AFTER bars (z-order in front, semi-transparent)?** Recommend **before bars**. Reasoning: k-ui renders the cell tint UNDER the events (tint is a background); chronix should match. Bar opacity stays 1.0 (no blending complexity).

Reply **按照推荐继续** to accept all three (`todayCellBg` naming, demo-only default-ON, before-bars render order) and proceed to Commit 1.
