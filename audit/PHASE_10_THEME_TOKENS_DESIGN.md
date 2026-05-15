# Phase 10 — Theme tokens (`ChronixTheme` prop)

**Status**: Approved (2026-05-15). Implementation in progress.

## Problem

`<ChronixGantt>`'s render function inlines ~24 distinct color
strings and 7 font-size / font-weight values today (`#f9fafb`,
`#d1d5db`, `#374151`, `#10b981`, `#3788d8`, etc.). Consumers who
want to recolor the header band, sidebar borders, progress
overlay, or dependency lines have no extension point — they'd have
to fork the adapter source.

This phase introduces a single `theme: Partial<ChronixTheme>` prop
backed by a `defaultChronixTheme` constant, so a consumer can
recolor the entire chrome with one prop merge. Bars stay
CSS-styleable (already a clean separation today — bar fills live
in `examples/gantt-vue3/src/styles.css` via `.cx-gantt-bar`); the
theme covers everything that's currently inline in the render fn.

This also subsumes the Phase 8 `defaultLinkColor` prop — now a
field on the theme rather than a standalone prop. Pre-1.0 / pre-
publish breaking change is acceptable.

## Reference (k-ui) behavior surface — full catalog

Walked `packages/gantt/src/theme/GlobalThemeOverrides.ts`,
`packages/gantt/src/theme/applyThemeOverrides.ts`, and the demo's
`themeOverrides` usage at `DemoApp.vue:1313-1586`. Each item is
marked ✅ done / ⏸️ parked / ❌ rejected for Phase 10.

### Token surface

1. ✅ **Flat token object** with semantic-prefix naming (e.g.
   `headerCellFill`, `progressFill`, `sidebarBackground`).
   Alternative: nested groups (`theme.header.cellFill`). Flat wins
   because `Partial<ChronixTheme>` deep-merges trivially with
   `{...defaults, ...overrides}` — nested would require a recursive
   merge helper, more API surface, harder to override one field.
2. ✅ **Colors as the v0 majority.** Every inline `#xxxxxx` in
   `<ChronixGantt>`'s render fn becomes a theme token: 18 color
   strings spanning chart background, header band, progress
   overlay, sidebar chrome, link defaults.
3. ✅ **Typography (font sizes + weights) included.** 5 font sizes
   and 2 font weights show up in the render fn (`font-size: 10`,
   `11`, `12`; `font-weight: 600`). Excluding them would leave a
   half-themed surface — adopters wanting compact / large-font
   variants would still have to fork.
4. ✅ **Stroke widths included.** `progressHandleStroke: 1` and
   `linkStrokeWidth: 1.5` are the only two inline stroke widths.
   Trivial to include.
5. ⏸️ **Border radii.** Chronix doesn't use `rx` / `ry` anywhere
   today. Empty token slot; can be added when bars or chrome grow
   rounded corners.
6. ⏸️ **Spacing / padding tokens** (e.g. header cell text padding,
   sidebar cell padding). Currently inline `padding: 0 8px` in
   sidebar styles. Parked; spacing rarely needs theme-level
   overrides and the chronix demos don't exercise it.
7. ⏸️ **Animation / transition tokens** (durations for hover,
   focus). Chronix has no animations today. Parked.
8. ❌ **Shadow tokens** (`box-shadow`). Chronix's chrome is flat
   by design; shadows are explicitly out of scope.
9. ⏸️ **Bar fill / stroke colors.** Bars are CSS-styled today
   (`.cx-gantt-bar { fill: ...; stroke: ... }` in consumer
   stylesheets). Pulling bar colors into the theme would conflict
   with the CSS approach; keep them separate so consumers can pick
   per-bar overrides via CSS attribute selectors. K-ui mixes the
   two (theme + per-event color); chronix prefers the cleaner
   layer separation.

### API shape

10. ✅ **`theme: Partial<ChronixTheme>` prop** on `<ChronixGantt>`.
    Default `{}`. Adapter merges with `defaultChronixTheme` at
    render time: `const effective = { ...defaultChronixTheme,
...props.theme }`.
11. ✅ **`defaultChronixTheme: ChronixTheme` exported** from
    `@chronixjs/gantt` (the core, not the adapter — the theme
    interface and defaults belong in the IR layer alongside other
    type definitions). Adapters re-export.
12. ⏸️ **`ChronixTheme` deep-readonly** (`readonly` modifiers on
    every field) — done. No nested objects so depth doesn't
    matter.
13. ⏸️ **Per-prop fallback** (e.g. `headerCellFill?: string` and
    omitted means "fall back to defaults"). The `Partial<>` type
    handles this naturally; `{...defaults, ...partialOverride}` is
    the merge.
14. ✅ **`defaultLinkColor` prop removed.** Now `theme.linkDefaultColor`.
    Breaking change for the chronix adapter — but chronix is
    pre-publish, so adopters don't exist yet. Phase 8 link-
    rendering tests that mention `defaultLinkColor` need updating
    (only one test exercises the prop directly; one assertion
    references it).

### Demo wiring

15. ⏸️ **Theme toggle in demo** (default light vs alternate
    contrast). Parked for v0 — the demo using the default theme
    is enough proof at the integration level. SFC tests prove the
    indirection at the unit level.
16. ⏸️ **Dark mode preset** (`darkChronixTheme` export). Parked.
    A consumer can build their own by spreading defaults and
    overriding ~10 fields.

### Implementation strategy

17. ✅ **Read tokens directly in the render fn** (no separate
    style computation step). The render fn already builds inline
    `h('rect', { fill: '...' })` — switching to `h('rect', { fill:
theme.headerCellFill })` is a one-token-per-callsite refactor.
18. ✅ **No CSS custom properties.** k-ui uses CSS vars
    (`--gantt-event-bg-color`) injected at the root via inline
    style. Chronix uses TS-side merging instead. Cleaner for the
    Vue3 adapter (no CSS-in-JS dependency); type-safe; works
    identically for the future React / Vue2 adapters. Trade-off:
    DevTools-visual override less convenient than editing a CSS
    var; consumers must re-pass the theme prop.
19. ❌ **Theme as a Vue3 `provide` / `inject`** — rejected.
    Inject would couple the theme distribution to Vue's reactivity
    system; chronix's other adapters (React, Vue2 planned) would
    need different theme distribution. Prop-based merging is
    cross-framework.

## Approach

### New `ChronixTheme` interface

`packages/gantt/src/api/chronix-theme.ts`:

```ts
/**
 * Visual customization tokens for <ChronixGantt>'s chrome. Bar fills
 * are NOT covered — those live in consumer CSS (`.cx-gantt-bar`).
 *
 * All fields are required on `ChronixTheme` proper; pass a
 * `Partial<ChronixTheme>` to the `theme` prop to override individual
 * tokens. The adapter merges `{ ...defaultChronixTheme, ...theme }`
 * at render time.
 */
export interface ChronixTheme {
  // ----- Chart -----
  /** Body SVG background (currently visible only when content height < wrapper). */
  readonly chartBackground: string;

  // ----- Header band -----
  /** Header SVG background; opaque so bars don't bleed during scroll. */
  readonly headerBackground: string;
  /** Cell fill for outer header rows (e.g. month bands). */
  readonly headerCellFill: string;
  /** Cell border stroke for outer header rows. */
  readonly headerCellStroke: string;
  /** Text color for header-row cell labels. */
  readonly headerCellLabel: string;
  /** Tick stroke color (vertical lines between hours / days). */
  readonly headerTickStroke: string;
  /** Text color for tick labels (e.g. '0时'). */
  readonly headerTickLabel: string;
  /** Stroke color for the divider between tick row and bar area. */
  readonly headerDivider: string;

  // ----- Progress overlay -----
  /** Fill color for the translucent progress overlay rect. */
  readonly progressFill: string;
  /** Fill-opacity for the progress overlay. */
  readonly progressFillOpacity: number;
  /** Fill color for the progress handle's grab rect. */
  readonly progressHandleFill: string;
  /** Stroke color for the progress handle (typically white for contrast). */
  readonly progressHandleStroke: string;
  /** Stroke width for the progress handle. */
  readonly progressHandleStrokeWidth: number;
  /** Text color for the progress label centered on the bar. */
  readonly progressLabel: string;

  // ----- Sidebar -----
  /** Background for both sidebar panes. */
  readonly sidebarBackground: string;
  /** Text color for sidebar header cells (column labels). */
  readonly sidebarHeaderCellLabel: string;
  /** Vertical-divider stroke between sidebar header cells. */
  readonly sidebarHeaderCellBorder: string;
  /** Horizontal divider stroke at the bottom of the sidebar header. */
  readonly sidebarHeaderDivider: string;
  /** Text color for sidebar body cells (row values). */
  readonly sidebarBodyCellLabel: string;
  /** Border stroke for sidebar body cells (vertical + horizontal). */
  readonly sidebarBodyCellBorder: string;

  // ----- Links -----
  /** Default stroke color for dependency lines (Phase 8). */
  readonly linkDefaultColor: string;
  /** Stroke width for dependency-line paths. */
  readonly linkStrokeWidth: number;

  // ----- Typography -----
  /** Font size for axis tick labels (e.g. '0时'). */
  readonly tickLabelFontSize: number;
  /** Font size for outer header-row labels (e.g. month names). */
  readonly headerCellLabelFontSize: number;
  /** Font size for sidebar header cells. */
  readonly sidebarHeaderFontSize: number;
  /** Font weight for sidebar header cells. */
  readonly sidebarHeaderFontWeight: number;
  /** Font size for sidebar body cells. */
  readonly sidebarBodyFontSize: number;
  /** Font size for the progress label. */
  readonly progressLabelFontSize: number;
  /** Font weight for the progress label. */
  readonly progressLabelFontWeight: number;
}

export const defaultChronixTheme: ChronixTheme = {
  chartBackground: '#ffffff',
  headerBackground: '#ffffff',
  headerCellFill: '#f9fafb',
  headerCellStroke: '#d1d5db',
  headerCellLabel: '#374151',
  headerTickStroke: '#d1d5db',
  headerTickLabel: '#6b7280',
  headerDivider: '#9ca3af',
  progressFill: '#10b981',
  progressFillOpacity: 0.35,
  progressHandleFill: '#059669',
  progressHandleStroke: '#ffffff',
  progressHandleStrokeWidth: 1,
  progressLabel: '#064e3b',
  sidebarBackground: '#ffffff',
  sidebarHeaderCellLabel: '#374151',
  sidebarHeaderCellBorder: '#d1d5db',
  sidebarHeaderDivider: '#9ca3af',
  sidebarBodyCellLabel: '#1f2937',
  sidebarBodyCellBorder: '#e5e7eb',
  linkDefaultColor: '#3788d8',
  linkStrokeWidth: 1.5,
  tickLabelFontSize: 10,
  headerCellLabelFontSize: 11,
  sidebarHeaderFontSize: 11,
  sidebarHeaderFontWeight: 600,
  sidebarBodyFontSize: 12,
  progressLabelFontSize: 11,
  progressLabelFontWeight: 600,
};
```

29 tokens total (24 colors + 5 typography). All default values are
exactly the current hard-coded values, so the default-theme render
is pixel-identical to today's render.

### Adapter wire-up

`<ChronixGantt>` props additions:

```ts
theme: {
  type: Object as PropType<Partial<ChronixTheme>>,
  default: () => ({}),
},
```

`defaultLinkColor` prop removed. The `LINK_STROKE_WIDTH` constant
removed (now `theme.linkStrokeWidth`).

In `setup()`:

```ts
const theme = computed<ChronixTheme>(() => ({
  ...defaultChronixTheme,
  ...props.theme,
}));
```

Every inline color / font in the render fn switches to read from
`theme.value`. The merge is reactive so a theme change re-renders.

### Demo

Demo continues using the default theme (no `:theme` prop on
`<ChronixGantt>`). VRT baselines unchanged. Adopters who want to
customize do `:theme="{ headerCellFill: '#fef3c7' }"` and see only
that one token change.

## Test coverage

### Core tests — `chronix-theme.test.ts` (+2)

1. `defaultChronixTheme` has all 29 fields defined (smoke test
   against the interface — guards against type-extension drift).
2. All default field types match the interface (string colors,
   number sizes / weights / opacities).

### Adapter tests — `chronix-gantt.test.ts` (+6)

3. Default-theme rendering: header tick label `fill` equals
   `defaultChronixTheme.headerTickLabel`, sidebar header cell
   `borderRight` includes `defaultChronixTheme.sidebarHeaderCellBorder`,
   etc. (sample 2-3 representative tokens).
4. `:theme="{ headerCellFill: '#fef3c7' }"` → outer header cells
   pick up the new fill while all other tokens stay at defaults.
5. `:theme="{ tickLabelFontSize: 14 }"` → tick label text's
   `font-size` attribute = 14.
6. `:theme="{ progressFill: '#7c3aed' }"` → progress overlay rect's
   `fill` = `#7c3aed`.
7. `:theme="{ linkDefaultColor: '#ef4444' }"` → bare link's `stroke`
   and the corresponding marker def's `fill` both use `#ef4444`.
8. `:theme="{ linkStrokeWidth: 3 }"` → link `<path>` `stroke-width`
   = 3.

### Phase 8 link-rendering test rewrite — `link-rendering.test.ts`

The single test that exercises `defaultLinkColor` prop directly
(line 271 — "no colorOverride → <path>.stroke uses defaultLinkColor
prop") becomes "no colorOverride → uses theme.linkDefaultColor"
with a `:theme="{ linkDefaultColor: '#10b981' }"` prop. Two
assertion-line tweaks; no new test count.

**Total new tests: 8.** core 190 → 192; vue3 130 → 136. Chronix
total 320 → 328.

## VRT impact

None expected. Every default theme value equals the corresponding
current hard-coded value byte-for-byte; default-mode renders are
pixel-identical. The 5 existing chronix VRT baselines re-verify
without changes. Run `chronix-verify` after Commit 2.

## Execution plan — 2 commits + wrap-up

### Commit 1: ChronixTheme interface + defaultChronixTheme + 2 core tests

- New file `packages/gantt/src/api/chronix-theme.ts` with the
  interface + the default constant.
- Export from `packages/gantt/src/api/index.ts` and the top-level
  `packages/gantt/src/index.ts`.
- New test file `packages/gantt/src/api/chronix-theme.test.ts`
  with 2 cases (shape + type smoke).
- No adapter changes yet — pure type / data landing.
- ci-check green → commit.

### Commit 2: adapter consumes theme + 6 SFC tests + Phase 8 test rewrite

- `<ChronixGantt>` props: add `theme: Partial<ChronixTheme>` (default
  `{}`); remove `defaultLinkColor`; remove `LINK_STROKE_WIDTH`
  constant.
- `setup()`: add `theme = computed(() => ({ ...defaultChronixTheme,
...props.theme }))`.
- Render fn: replace every inline `#xxxxxx` / `font-size` / `font-
weight` / `stroke-width` literal that lives in chronix-gantt.ts
  with `theme.value.<token>`. Audited list: 24 color literals + 5
  typography values + 2 stroke widths = 31 callsite swaps.
- Add 6 SFC tests in `chronix-gantt.test.ts` (default theme + 5
  partial-override probes).
- Rewrite the 1 link-rendering test that referenced
  `defaultLinkColor` to use `theme.linkDefaultColor` instead.
- Browser-verify: chronix demo at 8702 still renders pixel-identically
  to today (default theme). Pass a small theme override via the
  query string or a temp App.vue tweak to spot-check the indirection.
- ci-check green → commit.

### Commit 3: wrap-up (journal + design-doc status + memory)

- `audit/journal/2026-05-13.md` adds Phase 10 section.
- This doc's Status → DONE with commit shas.
- Memory `project_gantt_rewrite_plan.md` updated: test count
  320 → 328, Phase 10 added.

## Estimated scope

- Design doc: ~1 hour (this commit, separate)
- Commit 1 (interface + defaults + 2 tests): ~45 min
- Commit 2 (31 callsite swaps + 6 SFC tests + 1 rewrite): ~2 hours
- Commit 3 (wrap-up docs): ~30 min
- Browser verify: ~15 min
- **Total: ~4.5 hours focused work.**

## Open questions for the user

1. **Approve flat token namespace over nested groups?** Recommended
   — easier partial-override ergonomics. Catalog item 1 explains.

2. **Approve including typography + stroke-widths in v0** rather
   than colors-only? Recommended — leaves no half-themed surface.
   The +5 typography + 2 stroke-width tokens are trivial additions
   beside the 22 colors.

3. **Approve removing `defaultLinkColor` prop** (subsumed by
   `theme.linkDefaultColor`)? Recommended — pre-publish, no
   adopter churn, cleaner API. Alternative: deprecate but keep
   both. Recommend clean removal.

4. **Approve no CSS-custom-property layer?** chronix uses TS-side
   merging; consumers re-pass the prop to update. K-ui's CSS-var
   approach offers DevTools-tweakable values but couples chronix
   to a specific styling mechanism. Recommended: TS-only for
   cross-framework portability.

5. **Confirm bars stay CSS-styled** (not in the theme)? Bar fill /
   stroke / hover live in consumer CSS via `.cx-gantt-bar` today.
   Catalog item 9 parks pulling them in — recommend defer.

6. **Confirm no demo theme toggle in v0?** The default theme is
   pixel-identical to today; SFC tests prove indirection. A toggle
   adds UX scope without parity benefit. Recommended: defer.

7. **Confirm 29 tokens as v0 surface?** Adding more later is
   additive (no breaking change since `Partial<>` merge tolerates
   missing fields). Recommended: ship 29, expand on demand.

Reply **"按照推荐继续"** to accept all defaults (flat namespace,
include typography + strokes, remove `defaultLinkColor`, no CSS
vars, bars stay CSS-styled, no theme toggle in demo, 29-token
v0 surface).
