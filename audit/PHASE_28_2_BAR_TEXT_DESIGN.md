# Phase 28.2 — Bar title auto-render + font callbacks

**Status**: **DONE (2026-05-16)** — all 5 commits landed + /phase-close passed + ci-check green. See `audit/journal/2026-05-13.md` "Phase 28.2" section for full wrap-up.

> **Implementation notes (2026-05-16, mid-Phase-28.2)**:
>
> 1. **Parity fixture initially lacked titles** → chronix=0 across all assertions. Fixed by adding `title` to `ParityEvent` interface + populating from k-ui's per-event titles (verbatim from `examples/gantt/vue3/src/DemoApp.vue:691-1271`).
> 2. **Chronix emitted titles for off-axis bars** (kui=13 chronix=25 in day view): k-ui's `TimelineEvent` doesn't mount for bars whose calendar range falls outside the visible axis; chronix's bar render path produces a `PlacedBar` for every input bar (off-axis bars get `x < 0` or `x > totalWidth`). Same pattern as Phase 27's axis-overlap finding. Fix: adapter title-gate now checks `bar.x < a.totalWidth && bar.x + bar.width > 0` before emitting text. After fix: exact count parity (week 20=20, day 13=13, month 25=25).
> 3. **Content parity dropped from the test plan** — the parity reference combines title + progress textFormat into one element (`"Foo - 60% 完成"`); chronix keeps them as separate `<text>` elements (architectural divergence already documented as ❌ Reject for v0). Every event in the parity fixture carries progress, so there's no no-progress subset for clean comparison. Truncation-algorithm parity is covered by adapter tests that pin specific truncated strings (e.g. `"012..."`).

## Problem

The parity reference's default demo renders the event's title text inside
every bar wide enough to show it — a `<text class="gantt-event-text">`
positioned inside the bar's body, truncated with an ellipsis when
narrower than the title's natural width, and shifted right / clipped
left when continuation triangles (Phase 27) occupy the bar's edges.
The title makes bars **legible at a glance**: in chronix's current
default render, a user sees a row of colored rectangles with no
labels and must click each one (or rely on the demo's custom slot)
to know what each represents.

Chronix renders bar text **only** for bars that have a progress
overlay (`cx-gantt-progress-label`, Phase 7). Bars without
`progress.value` get no text at all. The parity gap is immediate
visual: side-by-side, k-ui shows the demo's bars labelled
("A33-液压系统检修", "73M-起落架大修", …) while chronix shows
identical-shaped colored rectangles with no labels.

User flagged this on the 2026-05-16 render-layer sweep as cluster C
item #1 (`audit/RENDER_LAYER_GAP_SWEEP_2026-05-16.md` Section H.7).
The gap escaped prior parity assertions for the same reason as
Phase 26 / Phase 27: bar-bbox parity diffs `(x, y, width, height)`;
text overlays are extra `<text>` elements that don't change the
bar rect's geometry.

Also user-flagged on the same sweep: per-bar font customization via
callbacks. K-ui exposes `eventFontSize(arg)` and `eventFontWeight(arg)`
that the host can use to drive font choices off bar data (e.g.
larger text for high-priority bars). Chronix has 3 color callbacks
(Phase 20: `barBackgroundColorCallback`, `barBorderColorCallback`,
`barTextColorCallback`) — the font callbacks are the natural
completion of the per-bar style cascade.

The remaining items in cluster C (`barClassNames` / `onLine` / link
slot) are additive APIs that don't touch the bar render branch.
Folding them in would inflate the phase past single-session
discipline (per `feedback_quality_acceleration.md`) without benefit
— defer to Phase 28.3 (additive callback follow-up).

## Reference (k-ui) behavior surface — full catalog

The render code lives in
`d:/work/k-ui/packages/gantt/src/timeline/TimelineEvent.tsx`:

- **Title render** (543-656): gated by `showText && finalWidth > 30
&& availableWidth >= 10`. Computes `titleStartX` accounting for
  continuation-left triangle (`!isEventStart`); `titleEndX`
  accounting for continuation-right triangle (`!isEventEnd`);
  `availableWidth = titleEndX - titleStartX`. Anchors at
  `(titleStartX, y + height/2)` with `dominantBaseline="middle"`.
- **Title + progress combo** (618-633): when both `title` and a
  progress `textFormat` exist, k-ui combines them — `{title}`
  substitution OR space-prepend the title if the format string
  doesn't reference it.
- **Title text element** (637-655): `fontSize` (defaulting `12px`),
  `fontWeight` (defaulting `'normal'`), `fontFamily="inherit"`,
  `textAnchor="start"`, `pointer-events: none`, `user-select: none`,
  class `gantt-event-text`. Fill from cascaded text color.
- **`truncateText` helper** (715-730):

  ```ts
  function truncateText(text, maxWidth, fontSize) {
    const avgCharWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    if (text.length <= maxChars) return text;
    if (maxChars <= 3) return '';
    return text.slice(0, maxChars - 3) + '...';
  }
  ```

  Character-count truncation — no DOM measurement, no canvas.
  `0.6 × fontSize` is the empirical average glyph width for the
  reference's default font stack. CJK characters are wider in
  practice but the formula treats them uniformly; demo data
  visually OK.

- **Font callbacks** (`event-rendering.ts:265-272, 617-618` +
  `EventContainer.tsx:94-99`): `eventFontSize(arg)` returns `number
| undefined`; `eventFontWeight(arg)` returns `string | undefined`.
  When set, override the default `12px` / `normal`. Both consumed at
  the `<text>` element's `fontSize` / `fontWeight` attributes.

### Surface-level disposition table

| Item                                                                                                                      | k-ui                                                               | chronix v0                                                                                                                                                                                                                                                                                                                                                                                                | Reason |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `gantt-event-text` element (auto title inside every wide-enough bar)                                                      | `TimelineEvent.tsx:637-655`                                        | ✅ **port** as `cx-gantt-bar-text` SVG `<text>` element                                                                                                                                                                                                                                                                                                                                                   |
| Show-text gate `finalWidth > 30 && availableWidth >= 10`                                                                  | `TimelineEvent.tsx:545, 611-613`                                   | ✅ **port** verbatim. Two thresholds: outer (`renderWidth > 30`) skips title for very narrow bars; inner (`availableWidth >= 10`) skips when triangles eat the title's space                                                                                                                                                                                                                              |
| Triangle-aware title position (`titleStartX` shifts right when `!bar.isStart`; `titleEndX` shifts left when `!bar.isEnd`) | `TimelineEvent.tsx:572-605`                                        | ✅ **port** — chronix already has `bar.isStart` / `bar.isEnd` from Phase 27. Title position offsets match k-ui: `triangleMargin + triangleSize + 4 = 11px` when triangle present, else `8px` left padding (or `4px` right padding)                                                                                                                                                                        |
| `truncateText` (char-count truncation with ellipsis at `floor(maxWidth / (fontSize × 0.6))` chars)                        | `TimelineEvent.tsx:715-730`                                        | ✅ **port** verbatim as `truncateBarText` helper (file-private adapter util). The `0.6` constant + ellipsis fallback + `<= 3` chars empty return — all preserved                                                                                                                                                                                                                                          |
| Title + progress textFormat combo (when both exist, combine)                                                              | `TimelineEvent.tsx:618-633`                                        | ❌ **Reject for v0** — chronix's progress label (`cx-gantt-progress-label`, Phase 7) is rendered as a SEPARATE `<text>` element centered on the bar (`text-anchor="middle"`). The title would be `text-anchor="start"`. Combining them visually is incoherent without geometry changes to either side. K-ui happens to combine because its progress text is the bar's only text element; chronix has both |
| Title `font-family: inherit`                                                                                              | `TimelineEvent.tsx:644`                                            | ✅ **port** — inherit from the SVG root's font-family (consumer-styled)                                                                                                                                                                                                                                                                                                                                   |
| Title `pointer-events: none` + `user-select: none`                                                                        | `TimelineEvent.tsx:648-650`                                        | ✅ **port** — text shouldn't intercept bar drag/click                                                                                                                                                                                                                                                                                                                                                     |
| Default `fontSize: 12`, `fontWeight: 'normal'`                                                                            | `TimelineEvent.tsx:642-643`                                        | ✅ **port** as theme tokens `barFontSize: 12` + `barFontWeight: 400` (numeric instead of `'normal'` for consistency with chronix's `progressLabelFontWeight` token)                                                                                                                                                                                                                                       |
| `eventFontSize(arg)` callback returning `number \| undefined`                                                             | `event-rendering.ts:265, 617` + `EventContainer.tsx:94-95`         | ✅ **port** as `barFontSizeCallback: (arg: BarStyleArg) => number \| undefined`. Same `BarStyleArg` shape as Phase 20's 3 color callbacks; same cascade slot (Layer 4)                                                                                                                                                                                                                                    |
| `eventFontWeight(arg)` callback returning `string \| undefined`                                                           | `event-rendering.ts:272, 618` + `EventContainer.tsx:97-99`         | ✅ **port** as `barFontWeightCallback: (arg: BarStyleArg) => number \| string \| undefined`. Accept both numeric (`600`) and CSS keyword (`'bold'`) — k-ui's typing is `string` only but numeric SVG font-weights are valid and chronix's `progressLabelFontWeight` is already numeric. Cast to string at the `<text>` attribute                                                                          |
| `eventClassNames` callback                                                                                                | `options.ts:193` + `event-rendering.ts` + `EventContainer.tsx:130` | ⏸️ **Defer to Phase 28.3** — additive CSS hook, doesn't touch bar render math. Bundles naturally with `onLine` + link slot phase                                                                                                                                                                                                                                                                          |
| `onLine` per-line callback                                                                                                | `ResourceTimelineDependencies.tsx:1038-1059`                       | ⏸️ **Defer to Phase 28.3** — affects link rendering, not bar rendering. Phase 28.2 is single-render-branch-scope                                                                                                                                                                                                                                                                                          |
| `useLineEventColor` boolean (line color from source event)                                                                | `ResourceTimelineDependencies.tsx:35`                              | ⏸️ **Defer to Phase 28.3** — bundles with `onLine`                                                                                                                                                                                                                                                                                                                                                        |
| Link slot in `slotRegistry`                                                                                               | k-ui has no slot system                                            | ⏸️ **Defer to Phase 28.3** — chronix-additive bundle with `onLine`                                                                                                                                                                                                                                                                                                                                        |

**Phase 28.2 net surface**: 7 ✅-port items (text render + triangle-aware
position + truncation + 2 theme tokens + 2 callbacks), 1 ❌-reject item
(title+progress combine — geometric incompatibility with chronix's
two-text-element model), 4 ⏸️-defer items (all into Phase 28.3).

The new chronix class name `cx-gantt-bar-text` mirrors k-ui's
`gantt-event-text` with the chronix `cx-` + bar-prefix swap.

## Approach

### Theme tokens — `packages/gantt/src/api/chronix-theme.ts`

Add 2 new flat tokens:

```ts
export interface ChronixTheme {
  // ... existing ...

  // ----- Bar text (Phase 28.2) -----
  /**
   * Font size (px) for auto-rendered bar title text
   * (`.cx-gantt-bar-text`). Default 12 — matches the parity
   * reference's `<text fontSize='12px'>` default.
   */
  readonly barFontSize: number;
  /**
   * Font weight for auto-rendered bar title text. Numeric (400 =
   * normal, 600 = semibold, etc.) to mirror chronix's existing
   * `progressLabelFontWeight` token. Default 400 — matches the
   * parity reference's `'normal'` fontWeight.
   */
  readonly barFontWeight: number;
}
```

Defaults: `barFontSize: 12`, `barFontWeight: 400`.

Update `chronix-theme.test.ts`:

- Add 2 new keys to `EXPECTED_TOKEN_KEYS` (44 → 46).
- Add `barFontSize` + `barFontWeight` to `numberKeys` (both numeric).

### Font callbacks — `packages/gantt/src/api/bar-style.ts`

Extend `BarStyleArg` to include resolved font defaults so font
callbacks (like color callbacks) can compare against the cascaded
default:

```ts
export interface BarStyleArg {
  readonly bar: BarSpec;
  readonly placedBar: PlacedBar;
  readonly isSelected: boolean;
  readonly activeTransaction: AnyTransaction | null;
  readonly defaultBackgroundColor: string;
  readonly defaultBorderColor: string;
  readonly defaultTextColor: string;
  /** Phase 28.2: resolved font size after layers 1-3 of the cascade. */
  readonly defaultFontSize: number;
  /** Phase 28.2: resolved font weight after layers 1-3 of the cascade. */
  readonly defaultFontWeight: number;
}
```

Add 2 new callback types alongside `BarColorFunc`:

```ts
/** Phase 28.2: font-size callback. Returns px number or undefined. */
export type BarFontSizeFunc = (arg: BarStyleArg) => number | undefined;
/** Phase 28.2: font-weight callback. Returns number / CSS keyword string / undefined. */
export type BarFontWeightFunc = (arg: BarStyleArg) => number | string | undefined;
```

Extend the resolver to produce font output alongside color:

```ts
export interface ResolvedBarStyle {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly textColor: string;
  /** Phase 28.2: resolved font size. */
  readonly fontSize: number;
  /** Phase 28.2: resolved font weight. */
  readonly fontWeight: number | string;
}

export interface ResolveBarStyleInput {
  // ... existing ...
  // Layer 1: theme defaults (font).
  readonly themeFontSize: number;
  readonly themeFontWeight: number;
  // Layer 4: font callbacks (no per-bar prop / spec layer for font —
  // start with theme + callback only; add prop / spec layers when a
  // consumer asks).
  readonly barFontSizeCallback?: BarFontSizeFunc;
  readonly barFontWeightCallback?: BarFontWeightFunc;
}
```

The resolver runs the font callbacks AFTER color resolution so the
`BarStyleArg.defaultFontSize` / `defaultFontWeight` reflect the
theme floor (no intermediate prop/spec layer in v0 — adding them
would require new `ChronixGantt` props like `barFontSize?: number`
which has no consumer ask yet).

### Adapter render — `adapters/vue3/src/chronix-gantt.ts`

Wire the 2 new theme defaults + 2 new callback props into
`resolveBarStyle()`. Add a file-private `truncateBarText` helper
that ports k-ui's `truncateText` verbatim. Emit the bar-text
`<text>` element in the per-bar `nodes.push` block after the
continuation triangles, before the progress fill (so the title
paints below the progress overlay — same Z-order rationale as
the parity reference):

```ts
function truncateBarText(text: string, maxWidth: number, fontSize: number): string {
  const avgCharWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  if (text.length <= maxChars) return text;
  if (maxChars <= 3) return '';
  return text.slice(0, maxChars - 3) + '...';
}
```

In the per-bar render block:

```ts
// Phase 28.2: bar title auto-render. Inserted AFTER continuation
// triangles (Phase 27) and BEFORE the progress fill so the title
// paints below the translucent progress overlay — matches the
// parity reference's layer order (rect → triangles → title →
// progress → label → handle).
//
// Gates: outer (`renderWidth > 30`) skips very narrow bars; inner
// (`availableWidth >= 10`) skips when continuation triangles eat
// most of the title's space. The same two thresholds the parity
// reference uses, ported verbatim.
//
// Title x accounts for left-side continuation triangle (Phase 27):
// when `!bar.isStart`, the triangle occupies the first
// TRIANGLE_MARGIN + TRIANGLE_SIZE = 7 px; titleStartX shifts right
// by 4 px past it (= 11 px total padding when triangle present, vs
// 8 px default).
const title = sourceBar?.title;
if (title && title.length > 0 && renderWidth > 30) {
  const leftPadding = !bar.isStart
    ? TRIANGLE_MARGIN + TRIANGLE_SIZE + 4 // triangle present — clear it + 4 px
    : 8; // normal — 8 px left inset
  const rightPadding = !bar.isEnd
    ? TRIANGLE_MARGIN + TRIANGLE_SIZE + 4 // right triangle present
    : 4; // normal — 4 px right inset
  const titleStartX = renderX + leftPadding;
  const titleEndX = renderX + renderWidth - rightPadding;
  const availableWidth = Math.max(0, titleEndX - titleStartX);
  if (availableWidth >= 10) {
    const truncated = truncateBarText(title, availableWidth, resolvedStyle.fontSize);
    if (truncated.length > 0) {
      nodes.push(
        h(
          'text',
          {
            key: `${bar.barId}-title`,
            'data-bar-id': bar.barId,
            class: 'cx-gantt-bar-text',
            x: titleStartX,
            y: renderY + bar.height / 2,
            fill: resolvedStyle.textColor,
            'font-size': resolvedStyle.fontSize,
            'font-weight': resolvedStyle.fontWeight,
            'font-family': 'inherit',
            'text-anchor': 'start',
            'dominant-baseline': 'middle',
            'pointer-events': 'none',
          },
          truncated,
        ),
      );
    }
  }
}
```

### Component prop surface

Add 2 new optional props to `<ChronixGantt>`:

```ts
// Existing Phase 20:
barColor?: string;
barBackgroundColor?: string;
barBorderColor?: string;
barTextColor?: string;
barBackgroundColorCallback?: BarColorFunc;
barBorderColorCallback?: BarColorFunc;
barTextColorCallback?: BarColorFunc;

// Phase 28.2 NEW:
barFontSizeCallback?: BarFontSizeFunc;
barFontWeightCallback?: BarFontWeightFunc;
```

NOT adding per-prop layers (`barFontSize?: number` / `barFontWeight?:
number`) in v0 — no consumer ask, and theme tokens already cover the
"set a chart-wide font" case. Per-bar variation goes through the
callback. Symmetric with how k-ui exposes only `eventFontSize` /
`eventFontWeight` callbacks (no prop-level `fontSize` / `fontWeight`).

### Sample consumer

```vue
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :bar-font-size-callback="(arg) => (arg.bar.extensions?.priority === 'high' ? 14 : undefined)"
    :bar-font-weight-callback="(arg) => (arg.bar.extensions?.priority === 'high' ? 600 : undefined)"
  />
</template>
```

Bars without `priority === 'high'` get the theme default (12 / 400);
high-priority bars get 14 / 600. Same cascade rule as Phase 20 color
callbacks — `undefined` returns fall through to the default.

### Alternatives considered

- **Bundle `barClassNames` + `onLine` + link slot into Phase 28.2** —
  Reject. Each is on a different render branch (bar CSS hook, link
  algorithm, link slot infrastructure) with its own decisions. ~14h
  total; violates single-session discipline. Phase 28.3 collects
  them naturally.

- **SVG `textLength` attribute for browser auto-truncation** —
  Reject. `textLength="N" lengthAdjust="spacingAndGlyphs"` scales
  glyph spacing to fit; visually compresses CJK text in a way that
  diverges from k-ui's char-count + ellipsis approach. Parity goal
  is "same truncated string, same visual" — easier with char-count.

- **Canvas-based pixel-perfect width measurement** — Reject.
  Requires `<canvas>` available at render time (jsdom doesn't have
  it; tests would skip the measurement path). Adds 30+ LOC of
  measurement cache + invalidation logic. K-ui's `0.6 × fontSize`
  approximation is "good enough" for the demo and passes parity.

- **Per-bar font props (`barFontSize?: number` on `BarSpec`)** —
  Defer-indefinite. K-ui doesn't expose per-event-spec font fields
  (only callbacks). Re-prioritize on consumer ask; add a Layer 3
  font cascade slot then.

- **Combine title + progress textFormat (k-ui's behavior at 618-633)** —
  Reject for v0. Chronix renders title (`text-anchor="start"`,
  left-of-bar) and progress label (`text-anchor="middle"`,
  bar-center) as two separate `<text>` elements with different
  geometry. Combining them needs either (a) drop the progress
  label, or (b) compute a different anchor when both exist —
  either breaks an existing parity assertion. K-ui doesn't have
  the same two-element split (its progress label IS the title in
  the combined case). Document as architectural divergence.

- **Theme tokens for `barFontFamily`** — Reject. K-ui uses
  `font-family: inherit`. Chronix matches. Consumer sets at the
  SVG root via CSS (`.cx-gantt-body { font-family: ... }`).

## Parity assertion plan — MANDATORY

This phase modifies `packages/gantt/src/api/bar-style.ts` (core),
`packages/gantt/src/api/chronix-theme.ts` (core), AND
`adapters/vue3/src/chronix-gantt.ts` (render). Parity assertions
are mandatory.

| Assertion id (in parity.spec.ts)                                 | Drives k-ui demo via             | Drives chronix demo via            | Compares                                                                                                                                               | Tolerance          |
| ---------------------------------------------------------------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| `phase28.2-bar-text count parity (week view)`                    | `loadBothDemos` → viewId `week`  | same, parity-mode (`?parity=true`) | Count of bar-title `<text>` elements (chronix `.cx-gantt-bar-text`; k-ui `.gantt-event-text`). Both sides emit one per bar wide enough to show a title | Exact equality     |
| `phase28.2-bar-text content parity (week view)`                  | same                             | same                               | Set of `textContent` values from both sides' bar-text elements. Same truncation algorithm + same titles → same strings                                 | Exact set equality |
| `phase28.2-bar-text count parity (day view)`                     | `loadBothDemos` → viewId `day`   | same                               | Day view has wider bars; fewer triangles ate the title space; count should still match exactly                                                         | Exact equality     |
| `phase28.2-bar-text-narrow gate respects threshold (month view)` | `loadBothDemos` → viewId `month` | same                               | Month view has narrower bars; many should fail the `renderWidth > 30` gate. Counts may both be 0 OR both be ≥1 (same threshold both sides)             | Exact equality     |

Selectors queried via `page.evaluate(() => document.querySelectorAll(selector).length)`
inline in each test. New `reference-dom-map.ts` export:
`BAR_TEXT` so chronix test code never names the upstream class
inline.

### Drift-detection scope

- **Covered**: structural counts of bar-text elements across 3
  views (day / week / month), each exercising a distinct width
  regime so the show-text gate fires at different bar subsets.
  Plus exact-text content parity in week view (the load-bearing
  truncation-algorithm check — if the algorithm drifts, truncated
  strings won't match).
- **NOT covered**: per-text `x` / `y` pixel positions. Chronix's
  title `x = placedBar.x + leftPadding`; k-ui's `x = barX +
leftPadding`. Per-bar x parity is implied by the existing bar-
  bbox parity (Phase 17/20.5).
- **NOT covered**: font-callback parity (k-ui and chronix demo
  don't wire identical font callbacks). The Phase 28.2 demo opts
  in to test the callback path on the chronix side only; cross-
  demo would require parallel wiring on both sides which adds
  scope. Adapter test covers the callback cascade.
- **NOT covered**: dominantBaseline / textAnchor attribute parity.
  Both sides use the same values; drift would be caught by visible
  text-position diff in VRT.

## Test coverage

- **core**: `packages/gantt/src/api/bar-style.test.ts` (+6 tests):
  - "resolveBarStyle returns themeFontSize / themeFontWeight when no
    callback set"
  - "barFontSizeCallback overrides theme default"
  - "barFontWeightCallback overrides theme default"
  - "callback can return `undefined` → cascade falls through to
    theme default"
  - "callback receives `defaultFontSize` / `defaultFontWeight` in
    BarStyleArg"
  - "both callbacks can fire simultaneously without interference"

- **adapter**: `adapters/vue3/src/chronix-gantt-bar-text.test.ts`
  (new, ~8 tests):
  - "emits one `.cx-gantt-bar-text` per bar with title + width > 30"
  - "omits text for bar with no title"
  - "omits text for bar with `renderWidth <= 30`"
  - "title `text` content is the bar's title verbatim when it fits"
  - "title `text` content is truncated with ellipsis when too narrow"
  - "title x is `renderX + 8` (default left padding)"
  - "title x is `renderX + 11` when bar has `!isStart` (triangle
    accounts for 11-px offset)"
  - "title fill / font-size / font-weight reflect the resolved
    style cascade (theme default when no callback)"

- **adapter callback test**: `adapters/vue3/src/chronix-gantt-bar-text.test.ts`
  (+~2 tests; bundled with the file above):
  - "barFontSizeCallback returning 14 emits `<text font-size='14'>`"
  - "barFontWeightCallback returning 600 emits `<text font-weight='600'>`"

- **parity**: `tooling/golden-runner/tests/parity.spec.ts`
  (+4 assertions per the table above).

Expected counts after Phase 28.2: vitest 546 → ~560 (+14: 6 core
font cascade + 8 adapter text + bundled callback tests); parity-spec
46 → 50 (+4); cross-demo verify scenarios 27 unchanged.

## VRT impact

**Re-baseline likely required** for chronix-side baselines whose
captured bars have titles. Predicted churn:

- **chronix-visual baselines** (5): every view has bars with titles
  (sample-data populates `title` on most bars). All 5 likely diff
  visibly — bar-text adds significant pixel coverage per bar.
- **cross-demo VRT baselines** (15 chronix-side): same logic. All
  15 likely diff.
- **K-ui-side baselines stay unchanged** (k-ui already had text).
- **Cross-demo cross scenarios stay within tolerance** OR improve:
  chronix bars previously had no text where k-ui did. The pixel
  diff vs k-ui actually IMPROVES when chronix gains the matching
  text (text positions align).

Estimated re-baseline count: 5 chronix-visual + 15 cross-demo vrt
PNGs = ~20. Same workflow as Phase 26.

## Execution plan — 4 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_28_2_BAR_TEXT_DESIGN.md`. Awaits user
confirmation of the 3 questions in the "Open questions" section
before implementation.

### Commit 2: Core — 2 theme tokens + font cascade in `bar-style.ts` + 6 core tests

- `packages/gantt/src/api/chronix-theme.ts`: add `barFontSize: 12`
  - `barFontWeight: 400` tokens.
- `packages/gantt/src/api/chronix-theme.test.ts`: add 2 new keys to
  `EXPECTED_TOKEN_KEYS` + `numberKeys`.
- `packages/gantt/src/api/bar-style.ts`: extend `BarStyleArg` with
  `defaultFontSize` + `defaultFontWeight`; add `BarFontSizeFunc` /
  `BarFontWeightFunc` types; extend `ResolveBarStyleInput` with
  `themeFontSize` / `themeFontWeight` / 2 callback fields; extend
  `ResolvedBarStyle` with `fontSize` / `fontWeight`; run callbacks
  after color cascade.
- `packages/gantt/src/api/bar-style.test.ts`: +6 tests covering
  font cascade.
- Rebuild `@chronixjs/gantt` dist.
- ci-check green (vitest 546 → ~552).

### Commit 3: Adapter — bar text render + 8-10 adapter tests + font callback wiring

- `adapters/vue3/src/chronix-gantt.ts`:
  - Add file-private `truncateBarText` helper (port of k-ui's
    `truncateText`).
  - Wire `barFontSizeCallback` / `barFontWeightCallback` props +
    theme tokens through `resolveBarStyle()`.
  - Add bar-text `<text>` emission in per-bar nodes block, AFTER
    continuation triangles, BEFORE progress fill.
- `adapters/vue3/src/chronix-gantt-bar-text.test.ts` (new, ~10
  tests including the 2 callback tests).
- Rebuild `@chronixjs/gantt-vue3` dist.
- ci-check green (vitest 552 → ~562).

### Commit 4: Parity assertions + VRT re-baseline + demo data verification

- `tooling/golden-runner/src/reference-dom-map.ts`: +1 selector
  (`BAR_TEXT`).
- `tooling/golden-runner/tests/parity.spec.ts`: +4 phase28.2-\*
  count + content parity assertions.
- Verify the parity-mode dataset has bar titles on enough bars to
  exercise all 4 assertions (likely yes; if not, extend the parity-
  events fixture — same surface as Phase 30's stack-test row).
- Run cross-demo verify; re-capture ~15 chronix-side baselines.
- Run chronix-visual verify; re-capture ~5 baselines.
- ci-check green; cross-demo-verify gate green (27/27).

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

- `audit/journal/2026-05-13.md` (continuation): "Phase 28.2 — Bar
  title auto-render + font callbacks (DONE, YYYY-MM-DD)" section
  per the strict 6-sub-section template.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 546 → 562;
  parity-spec 46 → 50; theme tokens 44 → 46; add Phase 28.2 DONE
  marker.
- `audit/PHASE_28_2_BAR_TEXT_DESIGN.md` Status → DONE.

## Estimated scope

| Commit                      | Hours   | LOC est.                                         |
| --------------------------- | ------- | ------------------------------------------------ |
| 1 (design doc)              | 1       | this file (~450 LOC)                             |
| 2 (core: tokens + cascade)  | 2       | ~80 LOC src + ~120 LOC tests                     |
| 3 (adapter: text + tests)   | 2.5     | ~120 LOC src + ~250 LOC tests                    |
| 4 (parity + VRT rebaseline) | 2.5     | ~150 LOC parity tests + ~20 baseline re-captures |
| 5 (wrap-up)                 | 0.5     | journal + memory + status flip                   |
| **Total**                   | **8.5** | ~720 LOC + ~20 baseline PNGs                     |

Within single-session discipline (per
`feedback_quality_acceleration.md` constraint #3). Within the 8-10h
estimate from the RENDER_LAYER_GAP_SWEEP Phase-28.2 row (after
deferring `barClassNames` + `onLine` + link slot to Phase 28.3 per
decision 1).

## 4-dimension audit check

| Dimension                     | Coverage in Phase 28.2                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Options surface**           | 2 new component-prop callbacks (`barFontSizeCallback`, `barFontWeightCallback`) + 2 new theme tokens (`barFontSize`, `barFontWeight`). No new component-level prop (decision: callback-only API per k-ui).  |
| **Render code**               | New per-bar `<text class="cx-gantt-bar-text">` emission in the body SVG render block. Triangle-aware position math accounts for Phase 27's `bar.isStart` / `isEnd` flags. Truncation via `truncateBarText`. |
| **Interaction code**          | Zero impact — `pointer-events: none` + `user-select: none` on every text element. Existing pointer/hit-test paths untouched.                                                                                |
| **Layout-algorithm pipeline** | Zero impact — text geometry derived at render time from existing `placedBar` + `bar.title` + resolved style. No new pass, no PlacedBar shape change.                                                        |

## Open questions for the user — 3 load-bearing decisions

**1. Scope: A (full 6-feature bundle from RENDER_LAYER_GAP_SWEEP) / B (text + font callbacks only, defer classNames + onLine + link slot to Phase 28.3) / C (text-only minimum)** — recommended **B**.

- **A**: bar text + truncation + `barClassNames` + `barFontSize/Weight`
  callbacks + `onLine` + link slot. ~12-14h; multiple render branches
  (bar, link, slotRegistry); breaks single-session discipline.
- **B** (recommended): bar text + truncation + `barFontSize/Weight`
  callbacks only. Single render branch (bar text), tight ~8.5h.
  `barClassNames` + `onLine` + link slot → Phase 28.3 follow-up
  (~5-6h, single session each).
- **C**: bar text + truncation only. Saves ~1h vs B by skipping
  font callbacks, but font callbacks naturally extend Phase 20's
  existing 3 color callbacks via the same `BarStyleArg` — the
  cascade infrastructure is reusable for ~0 marginal cost.

**Recommendation**: **B**. Closes the user-visible bar-text gap +
naturally extends Phase 20's callback cascade. `barClassNames` is
an additive CSS hook (independent), `onLine` + link slot are link-
render concerns (different branch) — they're not adjacent to bar
text and don't benefit from being bundled.

**2. Truncation algorithm: A (port k-ui's `floor(maxWidth / (fontSize × 0.6))` char-count + ellipsis verbatim) / B (SVG `textLength` browser auto-truncation) / C (canvas-based pixel measurement)** — recommended **A**.

- **A** (recommended): the same `0.6 × fontSize` empirical
  approximation k-ui uses. Deterministic (no DOM measurement) →
  unit-testable in jsdom. Matches reference truncation strings
  exactly → cross-demo content-parity assertion is feasible.
- **B**: SVG `textLength` + `lengthAdjust="spacingAndGlyphs"`.
  Browser scales glyph spacing to fit. Visually different (no
  ellipsis); CJK text gets compressed in a way that diverges
  from k-ui's render.
- **C**: canvas `measureText` for pixel-perfect widths.
  Unavailable in jsdom (tests would need a custom mock); adds
  measurement cache + invalidation logic. Overkill for the v0
  use case where parity matters more than absolute precision.

**Recommendation**: **A**. Matches k-ui's algorithm exactly,
trivial to port (15 LOC), unit-testable, deterministic.

**3. Font callback signature: A (separate `barFontSizeCallback` + `barFontWeightCallback` returning primitives, matching Phase 20's 3-color-callback pattern) / B (single combined callback returning a style object `{ fontSize?, fontWeight? }`) / C (extend `BarStyleArg` with resolved font fields for downstream consumers; no callbacks at all)** — recommended **A**.

- **A** (recommended): two separate funcs, each returning `number |
string | undefined`. Symmetric with `barBackgroundColorCallback`
  / `barBorderColorCallback` / `barTextColorCallback` from Phase
  20 — same `BarStyleArg`, same cascade slot, same `undefined`-
  falls-through semantics. Direct port of k-ui's
  `eventFontSize` / `eventFontWeight` shapes.
- **B**: single callback returning a partial object. More compact
  for callers setting both. But diverges from the established 3-
  color-callback pattern; introduces a second callback style for
  no clear benefit. Also harder to compose (consumer setting only
  fontSize still needs to remember to return `{ fontWeight:
undefined }`).
- **C**: no callbacks — only theme-token defaults. Insufficient
  for the user-flagged per-bar font-size case (e.g. larger title
  for high-priority bars).

**Recommendation**: **A**. Maintains the Phase 20 callback pattern;
direct port of k-ui's API shape.

Reply **按推荐继续** to accept all three (B / A / A), or call out
any 1-3 to override.
