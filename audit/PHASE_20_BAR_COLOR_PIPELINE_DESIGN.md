# Phase 20 — Bar color pipeline (`barColor` / `barBackgroundColor` / `barBorderColor` / `barTextColor` + callbacks)

**Status**: **DONE (2026-05-16)**. Landed as 2 commits: `1dadef3`
(design doc, 582 lines) → `e2ab288` (implementation: core resolver
+ 14 unit tests + adapter wiring + 6 SFC tests + demo + parity
helper extension + 2 cross-demo color tests). 240/240
chronix-gantt vitest (+14), 186/186 adapter vitest (+6), total
426/426 (was 406 at Phase 19 close). 27/27 parity assertions (was
25; +2 cross-demo bar fill parity assertions). 5/5 chronix VRT
baselines pass unchanged. `/phase-close` gate walked 6/6 green
before status flip. See `audit/journal/2026-05-13.md` "Phase 20"
section.

## Problem

`audit/PARITY_RECHECK.md` Batch 5 §5 — Event rendering / styling:
3/13 covered, classified **P0**. PARITY_RECHECK §246 entry 2 calls
out the gap:

> **`eventColor` / `eventBackgroundColor` / `eventBorderColor` /
> `eventTextColor` (4 options + 3 callback variants)** — demo wires
> all of them. Chronix has no per-bar color pipeline; consumer must
> inject custom slot template.

Today the only way for a host to color a chronix bar differently is
to register a `BAR_SLOT_NAME` template via the slot registry (Phase 11) and re-render the entire rect. Component-level color props,
per-bar style overrides, and per-bar style callbacks are all
missing — even though `BarSpec.style` already declares the shape
(`backgroundColor` / `borderColor` / `textColor` / `fontSize` /
`fontWeight`) at the IR layer (Phase 1).

The reference's pipeline at `packages/gantt/src/component/event-
rendering.ts:471-627` runs:

1. `buildEventContentArg` assembles defaults from
   `ui.{textColor, backgroundColor, borderColor}` + the 4
   component options + per-event `EventDef.ui` overrides
2. `getEventStyles` calls the 3 style callbacks
   (`eventBackgroundColor` / `eventBorderColor` / `eventTextColor`)
   in order; each can override the resolved default
3. Special-case: if `eventBackgroundColor` callback resolves to a
   value but `eventBorderColor` callback does not, the new
   background also becomes the border (umbrella semantic)
4. Final inline styles applied to the rendered event

Phase 20 ports this pipeline with chronix-native naming
(`barColor` instead of `eventColor` etc.), wires `BarSpec.style`
through to the default `<rect>` render, and adds 3 component-
level callbacks for runtime resolution.

**Phase 10 amendment**: Phase 10 explicitly left bar fills in
CSS (`.cx-gantt-bar { fill: #3b82f6 }`). Phase 20 reverses that
decision — bar colors move to theme tokens + inline attributes so
the eventColor pipeline can reach them at runtime. Non-color
visual hooks (border-radius, cursor) stay in CSS.

## Reference (k-ui) behavior surface — full catalog

| Item                                                                                                 | k-ui                                                                                                                                    | chronix v0                                                                                                           | Reason                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `eventColor: string` — umbrella that sets both background + border                                   | `options.ts:192`; in `compileEventUi` becomes both `ui.backgroundColor` AND `ui.borderColor` when more specific are absent              | ✅ port — `barColor?: string` on `<ChronixGantt>`; when set and the specific props aren't, applies to both           | direct semantic match                                                                                                                                                                                                                |
| `eventBackgroundColor: string` — default bar fill at component level                                 | `options.ts:187`                                                                                                                        | ✅ port — `barBackgroundColor?: string` on `<ChronixGantt>`; applied as inline `fill=` when no spec/callback wins    | matches the option pipeline                                                                                                                                                                                                          |
| `eventBorderColor: string` — default bar stroke at component level                                   | `options.ts:188`                                                                                                                        | ✅ port — `barBorderColor?: string` on `<ChronixGantt>`; applied as inline `stroke=`                                 | matches the option pipeline                                                                                                                                                                                                          |
| `eventTextColor: string` — default text color (event title, progress label)                          | `options.ts:189` + default `'#fff'` at `options.ts:356`                                                                                 | ✅ port — `barTextColor?: string` on `<ChronixGantt>`; applies to progress text + `BarSlotArgs.resolvedTextColor`    | chronix v0 only renders progress text via the bar's built-in render (the bar title text is parked); custom slot renderers consume `resolvedTextColor`                                                                                |
| Background-overrides-border umbrella semantic                                                        | `event-rendering.ts:604-612` — when `eventBackgroundColor` resolves through ANY layer but `eventBorderColor` does not, use bg as border | ✅ port — same cascading rule in `resolveBarStyle`                                                                   | this is the reason for the `barColor` umbrella in the first place — the host can recolor an entire bar with one prop                                                                                                                 |
| `eventStyleCallbacks.eventBackgroundColor: (arg) => string \| undefined`                             | `event-rendering.ts:251` + `getEventStyles:597-599`                                                                                     | ✅ port — `barBackgroundColorCallback?: (arg: BarStyleArg) => string \| undefined`; receives chronix-native arg      | callback shape matches; `BarStyleArg` is chronix-native, NOT `EventContentArg`                                                                                                                                                       |
| `eventStyleCallbacks.eventBorderColor: (arg) => string \| undefined`                                 | `event-rendering.ts:258` + `getEventStyles:601-602`                                                                                     | ✅ port — `barBorderColorCallback?: (arg: BarStyleArg) => string \| undefined`                                       | same                                                                                                                                                                                                                                 |
| `eventStyleCallbacks.eventTextColor: (arg) => string \| undefined`                                   | `event-rendering.ts:244` + `getEventStyles:614-616`                                                                                     | ✅ port — `barTextColorCallback?: (arg: BarStyleArg) => string \| undefined`                                         | same                                                                                                                                                                                                                                 |
| `eventStyleCallbacks.eventFontSize: (arg) => number \| undefined`                                    | `event-rendering.ts:265`                                                                                                                | ⏸️ parked — no built-in bar-title text yet; revisit when bar text rendering lands                                    | chronix v0's only bar-internal text is the progress label, which uses `theme.progressLabelFontSize`. Per-bar font-size could plumb to the progress label but punts the deeper "bar title text" infrastructure. Park as cohesive unit |
| `eventStyleCallbacks.eventFontWeight: (arg) => string \| undefined`                                  | `event-rendering.ts:272`                                                                                                                | ⏸️ parked — same reason as `eventFontSize`                                                                           | same                                                                                                                                                                                                                                 |
| Per-event `EventDef.ui.{backgroundColor, borderColor, textColor}` overrides                          | `event-rendering.ts:165` + `compileEventUi` merges defaults + per-event                                                                 | ✅ port — `BarSpec.style.{backgroundColor, borderColor, textColor}` wired through (was defined in Phase 1, unused)   | the IR field exists since Phase 1 but was never consumed by the render — closes that gap                                                                                                                                             |
| Resolution order (deepest wins)                                                                      | `compileEventUi`: base + per-event-def-id + per-event-instance; callbacks run AFTER on the assembled value                              | ✅ port — theme → component prop → `BarSpec.style` → callback (deepest wins). Each layer's `undefined` falls through | matches the reference's cascading semantics                                                                                                                                                                                          |
| `EventContentArg` (16 fields including `event`, `isMirror`, `isStart`, `isPast`, `view`, `timeText`) | `event-rendering.ts:198-221`                                                                                                            | ⏸️ parked subset — `BarStyleArg` carries `bar` + `placedBar` + `isSelected` + `activeTransaction` + 3 default colors | 12 of the 16 fields depend on infrastructure chronix doesn't have (multi-segment bars for past/future split, nowTimer for today, eventApi for full inspection, dragging/resizing flags); the 4 essential ones are present            |
| Default `eventTextColor: '#fff'`                                                                     | `options.ts:356`                                                                                                                        | ✅ port — `defaultChronixTheme.barTextColor: '#ffffff'`                                                              | matches the reference's literal default                                                                                                                                                                                              |
| Bar text rendering (event title inside the rect)                                                     | k-ui's `Event` component renders `<EventTitle>` with `text-color: ${resolved}` inline style                                             | ❌ rejected v0 — chronix's default `<rect>` has no `<text>` child; only progress overlay has text                    | adding a bar-title render is a separate UX decision (truncation, ellipsis, multi-line, RTL) outside Phase 20's color-pipeline scope. The `barTextColor` prop still applies to the progress label + custom slot args                  |
| Bar-fill in CSS vs inline (Phase 10 architectural choice)                                            | k-ui applies inline `style` on every rendered event                                                                                     | ✅ port (amends Phase 10) — chronix moves bar fill from `.cx-gantt-bar` CSS to inline `fill=` driven by theme        | the eventColor pipeline must reach the inline render path; CSS rules can't be runtime-overridden by component props at the per-bar grain                                                                                             |

## Approach

### New types (in `packages/gantt/src/api/bar-style.ts`)

```ts
import type { BarSpec } from '../ir/index.js';
import type { PlacedBar } from '../layout/types.js';
import type { AnyTransaction } from '../interaction/index.js';

/**
 * Argument bag passed to each `bar*ColorCallback`. Chronix-native
 * shape — does NOT mirror the reference's `EventContentArg` because
 * 12 of its 16 fields depend on infrastructure chronix doesn't have
 * yet (multi-segment bars, nowTimer, full event-api shell). The 4
 * essential fields (bar, placedBar, selected state, active txn) are
 * present; the 3 resolved defaults let callbacks compute against the
 * current pipeline state rather than re-doing the resolution math.
 */
export interface BarStyleArg {
  readonly bar: BarSpec;
  readonly placedBar: PlacedBar;
  readonly isSelected: boolean;
  readonly activeTransaction: AnyTransaction | null;
  /** Resolved background before the callback runs (theme → prop → spec.style). */
  readonly defaultBackgroundColor: string;
  /** Resolved border before the callback runs. */
  readonly defaultBorderColor: string;
  /** Resolved text color before the callback runs. */
  readonly defaultTextColor: string;
}

/** Style callback shape — returns a color string or `undefined` to defer. */
export type BarColorFunc = (arg: BarStyleArg) => string | undefined;

/**
 * The final resolved per-bar style, fed to the default `<rect>` render
 * and to `BarSlotArgs.resolvedXxx`.
 */
export interface ResolvedBarStyle {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly textColor: string;
}

/**
 * Input to `resolveBarStyle` — bundle of all the layers the resolver
 * walks through, in the order it walks them.
 */
export interface ResolveBarStyleInput {
  readonly bar: BarSpec;
  readonly placedBar: PlacedBar;
  readonly isSelected: boolean;
  readonly activeTransaction: AnyTransaction | null;
  // Layer 1: theme defaults (always present).
  readonly themeBackgroundColor: string;
  readonly themeBorderColor: string;
  readonly themeTextColor: string;
  // Layer 2: component-prop layer.
  readonly barColor?: string;
  readonly barBackgroundColor?: string;
  readonly barBorderColor?: string;
  readonly barTextColor?: string;
  // Layer 3: spec.style (read from `bar.style`).
  // Layer 4: callbacks.
  readonly barBackgroundColorCallback?: BarColorFunc;
  readonly barBorderColorCallback?: BarColorFunc;
  readonly barTextColorCallback?: BarColorFunc;
}
```

### Resolver

```ts
export function resolveBarStyle(input: ResolveBarStyleInput): ResolvedBarStyle {
  // Layer 1: theme defaults are the floor.
  let backgroundColor = input.themeBackgroundColor;
  let borderColor = input.themeBorderColor;
  let textColor = input.themeTextColor;

  // Track whether each channel was overridden by a non-theme layer.
  // The umbrella rule (bg-overridden → border-inherits-bg) consults
  // this. Track precisely so we don't trigger umbrella when only the
  // theme drives bg.
  let backgroundFromOverride = false;
  let borderFromOverride = false;

  // Layer 2: component-prop layer. `barColor` is the umbrella;
  // specific props win when set.
  if (input.barColor !== undefined) {
    backgroundColor = input.barColor;
    borderColor = input.barColor;
    backgroundFromOverride = true;
    borderFromOverride = true;
  }
  if (input.barBackgroundColor !== undefined) {
    backgroundColor = input.barBackgroundColor;
    backgroundFromOverride = true;
  }
  if (input.barBorderColor !== undefined) {
    borderColor = input.barBorderColor;
    borderFromOverride = true;
  }
  if (input.barTextColor !== undefined) {
    textColor = input.barTextColor;
  }

  // Layer 3: BarSpec.style per-bar override.
  const style = input.bar.style;
  if (style?.backgroundColor !== undefined) {
    backgroundColor = style.backgroundColor;
    backgroundFromOverride = true;
  }
  if (style?.borderColor !== undefined) {
    borderColor = style.borderColor;
    borderFromOverride = true;
  }
  if (style?.textColor !== undefined) {
    textColor = style.textColor;
  }

  // Layer 4: callbacks. Build the arg AFTER layers 1-3 so the
  // callback can compare against the cascaded defaults.
  if (
    input.barBackgroundColorCallback ||
    input.barBorderColorCallback ||
    input.barTextColorCallback
  ) {
    const arg: BarStyleArg = {
      bar: input.bar,
      placedBar: input.placedBar,
      isSelected: input.isSelected,
      activeTransaction: input.activeTransaction,
      defaultBackgroundColor: backgroundColor,
      defaultBorderColor: borderColor,
      defaultTextColor: textColor,
    };
    if (input.barBackgroundColorCallback) {
      const result = input.barBackgroundColorCallback(arg);
      if (result !== undefined) {
        backgroundColor = result;
        backgroundFromOverride = true;
      }
    }
    if (input.barBorderColorCallback) {
      const result = input.barBorderColorCallback(arg);
      if (result !== undefined) {
        borderColor = result;
        borderFromOverride = true;
      }
    }
    if (input.barTextColorCallback) {
      const result = input.barTextColorCallback(arg);
      if (result !== undefined) {
        textColor = result;
      }
    }
  }

  // Umbrella rule: bg overridden, border still from theme → use bg
  // as border. Matches the reference's same-pipeline behavior
  // (event-rendering.ts:604-612).
  if (backgroundFromOverride && !borderFromOverride) {
    borderColor = backgroundColor;
  }

  return { backgroundColor, borderColor, textColor };
}
```

### Theme additions (in `packages/gantt/src/api/chronix-theme.ts`)

```ts
// New tokens in ChronixTheme:
readonly barBackgroundColor: string;
readonly barBorderColor: string;
readonly barTextColor: string;
```

```ts
// In defaultChronixTheme — match the current CSS defaults exactly:
barBackgroundColor: '#3b82f6',
barBorderColor: '#1e40af',
barTextColor: '#ffffff',
```

### CSS removal (in `examples/gantt-vue3/src/styles.css`)

```css
.cx-gantt-bar {
  /* Removed: fill: #3b82f6; stroke: #1e40af; stroke-width: 1; */
  rx: 3;
  ry: 3;
  cursor: move;
}

/* `.cx-gantt-bar--selected` stays unchanged (Phase 12 selection styling). */
```

The visual result is unchanged at the default-no-override case
because `defaultChronixTheme.barBackgroundColor / barBorderColor`
match the prior CSS literals byte-for-byte.

### `<ChronixGantt>` props + emits

Props added (all optional):

```ts
barColor: { type: String as PropType<string | undefined>, default: undefined },
barBackgroundColor: { type: String as PropType<string | undefined>, default: undefined },
barBorderColor: { type: String as PropType<string | undefined>, default: undefined },
barTextColor: { type: String as PropType<string | undefined>, default: undefined },
barBackgroundColorCallback: { type: Function as PropType<BarColorFunc | undefined>, default: undefined },
barBorderColorCallback: { type: Function as PropType<BarColorFunc | undefined>, default: undefined },
barTextColorCallback: { type: Function as PropType<BarColorFunc | undefined>, default: undefined },
```

No new emits — the pipeline is read-only per-render.

### Default `<rect>` render (inline-color application)

```ts
// At the default-rect branch of the bar render loop:
const sourceBar = props.bars.find((b) => b.id === bar.barId)!;
const style = resolveBarStyle({
  bar: sourceBar,
  placedBar: bar,
  isSelected,
  activeTransaction: activeTxn,
  themeBackgroundColor: t.barBackgroundColor,
  themeBorderColor: t.barBorderColor,
  themeTextColor: t.barTextColor,
  ...(props.barColor !== undefined ? { barColor: props.barColor } : {}),
  ...(props.barBackgroundColor !== undefined
    ? { barBackgroundColor: props.barBackgroundColor }
    : {}),
  ...(props.barBorderColor !== undefined ? { barBorderColor: props.barBorderColor } : {}),
  ...(props.barTextColor !== undefined ? { barTextColor: props.barTextColor } : {}),
  ...(props.barBackgroundColorCallback
    ? { barBackgroundColorCallback: props.barBackgroundColorCallback }
    : {}),
  ...(props.barBorderColorCallback ? { barBorderColorCallback: props.barBorderColorCallback } : {}),
  ...(props.barTextColorCallback ? { barTextColorCallback: props.barTextColorCallback } : {}),
});
nodes.push(
  h('rect', {
    key: bar.barId,
    'data-bar-id': bar.barId,
    class: isSelected ? 'cx-gantt-bar cx-gantt-bar--selected' : 'cx-gantt-bar',
    x: renderX,
    y: renderY,
    width: renderWidth,
    height: bar.height,
    fill: style.backgroundColor,
    stroke: style.borderColor,
  }),
);
```

The progress-label `<text>` element gets `fill: style.textColor`
when progress is rendered for the same bar — single resolver
output drives both rect and label.

### `BarSlotArgs` additions

```ts
export interface BarSlotArgs {
  // ... existing fields ...
  /** Phase 20: resolved background color (theme → prop → spec.style → callback). */
  readonly resolvedBackgroundColor: string;
  readonly resolvedBorderColor: string;
  readonly resolvedTextColor: string;
}
```

Custom slot renderers consume the same resolved style the default
rect would use — drop-in.

### Demo wiring

In `examples/gantt-vue3/src/App.vue`:

- Add `priority?: 'high' | 'medium' | 'low'` to a handful of sample
  bars via `extendedProps`.
- Add a "bar styling" toggle group with 3 toggles:
  - "themed bars" → passes `:bar-background-color="'#10b981'" :bar-border-color="'#047857'"`
  - "umbrella color" → passes `:bar-color="'#8b5cf6'"`
  - "priority callback" → wires a callback that reads `bar.extendedProps.priority` and returns `'#ef4444'` / `'#f59e0b'` / `'#84cc16'` for high/medium/low
- All default OFF; baseline render is unchanged.

In parity mode (`?parity=true`), the demo additionally wires
`:bar-background-color="'#3788d8'" :bar-border-color="'#3788d8'"
:bar-text-color="'#fff'"` — the reference demo's literal defaults
— so the cross-demo bar-fill parity tests have matching baselines
to compare.

### Alternative approaches considered

1. **Keep CSS for default bar fills + apply inline only when an
   override path is exercised**. Less invasive (Phase 10's choice
   stands for the no-override case). Rejected because: (a) it
   creates a 4-level cascade where the theme tokens are unreachable
   for the default render (CSS wins); (b) host upgrades can't audit
   "all bar colors are theme-driven" — some come from CSS, some
   from theme. Single source of truth + Phase 10 amendment is
   cleaner.

2. **Combine `barBackgroundColor` / `barBorderColor` / `barTextColor`
   into one object prop `barStyles: { bg?, border?, text? }`**.
   Rejected — diverges from the reference's flat prop shape and
   makes per-channel callback wiring more verbose. The flat surface
   matches user mental model of "set the bar's bg color".

3. **Add bar-title text rendering in this phase** (so `barTextColor`
   has a default consumer beyond progress text). Rejected — text
   rendering has UX decisions (truncation, ellipsis, multi-line,
   alignment, padding) that deserve their own phase. v0 applies
   `barTextColor` to (a) progress label, (b) `BarSlotArgs.resolvedTextColor`
   for custom renderers.

4. **Plumb `fontSize` / `fontWeight` through too** (5 callbacks
   total, matching the reference). Rejected — see catalog row for
   `eventFontSize`. Without bar-title text, the only consumer is
   the progress label; coupling per-bar font config to a single
   built-in text element is awkward. Park.

5. **Use Vue3 `<style>` injection (one rule per bar) instead of
   inline attributes**. Rejected — inline attribute is the
   minimum-surface change, plays nicely with SVG paint order, and
   matches the reference's inline-style pipeline. Style injection
   would also slow per-frame re-renders during drag.

## Parity assertion plan — MANDATORY

The chronix bar render now applies inline `fill=` / `stroke=` driven
by the resolver. Cross-demo parity is feasible: load both demos in
parity mode with matching color wiring + extract per-bar fill +
diff. Two assertions:

| Assertion id (in parity.spec.ts)                                         | Drives k-ui demo via                                                                                           | Drives chronix demo via                                                                                                           | Compares                                                                               | Tolerance                                                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `cross-demo bar fill parity (default colors, day view)`                  | `loadBothDemos` → k-ui at 8701 (its `eventBorderColor: '#3788d8'` default applies)                             | `loadBothDemos` → chronix at 8702 with `?parity=true` (parity-mode wires `:bar-background-color="'#3788d8'"`)                     | Per-bar `fill` (via `getComputedStyle` or attribute) for the 13 in-range day-view bars | exact string equality after normalization (lowercase hex, no alpha) |
| `cross-demo bar fill parity (callback-driven priority colors, day view)` | `loadBothDemos` → k-ui at 8701 (its `eventStyleCallbacks.eventBackgroundColor` reads `extendedProps.priority`) | `loadBothDemos` → chronix at 8702 with `?parity=true` + URL flag `?priorityCallback=true` (parity mode wires a matching callback) | Per-bar `fill` for bars whose parity-events have `priority: 'high' \| 'medium'`        | exact string equality                                               |

This requires extending `parity-helpers.ts`'s
`extractBarsSnapshot` to capture `fill` alongside geometry — small
addition (~10 LOC). The 2 cross-demo assertions land in the same
commit as the resolver per parity discipline.

In-process tests are NOT a substitute for the cross-demo
assertions: the chronix resolver could correctly implement the
described cascade and still produce different colors than k-ui if
chronix theme defaults differ. Cross-demo with explicit color
wiring is the honest check.

## Test coverage

- core: `packages/gantt/src/api/bar-style.test.ts` (+12 tests):
  - theme default returned when no overrides
  - `barColor` umbrella sets both bg + border
  - `barColor` umbrella loses to specific `barBackgroundColor`
  - `BarSpec.style.backgroundColor` overrides component prop
  - Callback overrides spec.style
  - Callback returning `undefined` defers (resolved color stays the spec.style value)
  - Background-overrides-border umbrella when only bg is set via callback
  - Background-overrides-border umbrella DOES NOT fire when both bg and border are from theme
  - Cascade order: theme → prop → spec.style → callback (precedence assertion)
  - Callback `arg.defaultBackgroundColor` reflects cascade so far
  - `isSelected` flag passes through to callback arg
  - `activeTransaction` passes through to callback arg
- adapter: `adapters/vue3/src/chronix-gantt.test.ts` (+6 tests):
  - default bar `<rect>` has inline `fill` = theme default
  - `barBackgroundColor` prop → inline `fill` overrides theme
  - `BarSpec.style.backgroundColor` → inline `fill` overrides prop
  - `barBackgroundColorCallback` → inline `fill` from callback
  - `barTextColor` prop → progress text `fill` reflects override
  - Default `<rect>` still has `cx-gantt-bar` class (regression for CSS rx/ry/cursor)
- parity: `tooling/golden-runner/tests/parity.spec.ts` (+2 cross-demo color assertions, see above)
- demo: manually browser-verify via the 3 toggleable styling options

## VRT impact

**Re-baseline expected** for the 5 chronix VRT goldens. The default
colors are byte-identical to the prior CSS (`#3b82f6` / `#1e40af`),
but the inline attributes apply now, which means Playwright's
screenshot rendering may compute the rect's painted fill via
inline vs CSS resolution path — different SVG engines might
sub-pixel render differently when one path includes inline-style
inheritance vs class-cascade resolution.

If the 5 baselines stay byte-equivalent after the change, no
re-baseline needed. Likely scenario: byte-equivalent because the
final painted fill is the same. Run the visual suite first; only
re-baseline if a diff appears.

## Execution plan — 1 commit + wrap-up

### Commit 1: `feat(gantt): bar color pipeline (Phase 20)`

- `packages/gantt/src/api/bar-style.ts` (new): types
  (`BarStyleArg`, `BarColorFunc`, `ResolvedBarStyle`, `ResolveBarStyleInput`)
  - pure `resolveBarStyle(input)` resolver.
- `packages/gantt/src/api/bar-style.test.ts` (new): 12 unit tests.
- `packages/gantt/src/api/chronix-theme.ts`: add 3 new tokens
  (`barBackgroundColor`, `barBorderColor`, `barTextColor`) + matching
  defaults.
- `packages/gantt/src/api/chronix-theme.test.ts`: existing test
  expanded to cover the 3 new tokens.
- `packages/gantt/src/api/index.ts` + `packages/gantt/src/index.ts`:
  re-export the new types + resolver.
- `packages/gantt/src/render/bar-slot.ts`: add 3 `resolvedXxx` fields
  to `BarSlotArgs`.
- `adapters/vue3/src/chronix-gantt.ts`: 7 new props (4 colors + 3
  callbacks). Apply `resolveBarStyle` per bar; inline `fill=` /
  `stroke=` on default rect; `fill=` on progress label; thread
  resolved colors into `BarSlotArgs`.
- `adapters/vue3/src/chronix-gantt.test.ts`: +6 SFC tests.
- `examples/gantt-vue3/src/App.vue`: add `priority` `extendedProps`
  to a few sample bars; add "bar styling" toggle group (3 toggles).
  Parity-mode wires reference-matching defaults + a matching
  priority callback. Demo's existing CSS doesn't need changes — only
  the host `styles.css` does.
- `examples/gantt-vue3/src/styles.css`: drop `fill: #3b82f6;
stroke: #1e40af; stroke-width: 1` from `.cx-gantt-bar`. Keep
  `rx: 3; ry: 3; cursor: move`.
- `tooling/golden-runner/src/parity-helpers.ts`: extend
  `extractBarsSnapshot` to capture `fill` alongside `(x, y, width,
height)`. Backward-compatible additive field.
- `tooling/golden-runner/tests/parity.spec.ts`: +2 cross-demo
  color parity assertions.
- **Browser verify**: chronix demo at 8702. Toggle each "bar
  styling" option; bars recolor live. Confirm parity-mode wiring
  (load `?parity=true`) produces `#3788d8` bars.
- **Anti-regression**: existing 25 parity assertions + 406 vitest +
  5 VRT baselines re-run; baselines re-captured if pixel diff.

### Commit 2 (wrap-up — REQUIRES `/phase-close` invocation)

- `audit/journal/2026-05-13.md`: "Phase 20" section with all 6
  required sub-sections.
- Memory `project_gantt_rewrite_plan.md` + `MEMORY.md`: bump
  Phase 19 → Phase 20 + test count.
- This doc's Status → DONE.

## Estimated scope

- `bar-style.ts` resolver: ~130 LOC (~1 h)
- `bar-style.test.ts` (12 tests): ~250 LOC (~1.25 h)
- Theme additions + tests: ~30 LOC (~15 min)
- ChronixGantt prop/render/threading: ~80 LOC (~1 h)
- ChronixGantt SFC tests (6): ~150 LOC (~1 h)
- BarSlotArgs additions: ~10 LOC (~10 min)
- Demo wiring: ~80 LOC (~30 min)
- CSS removal: ~5 LOC (~5 min)
- Parity helper extension + 2 tests: ~120 LOC (~1 h)
- VRT re-baseline (if needed): ~10 min
- Browser verify + bug-fix: ~30 min
- Wrap-up + `/phase-close`: ~30 min
- **Total: ~6-7 hours focused work, ~850 LOC.**

## Open questions for the user

1. **Approve Phase 10 amendment** — move bar fills from CSS to
   inline-via-theme-tokens? Trade-off: clean single-source-of-truth
   - eventColor pipeline reach vs. Phase 10's "bar fills in CSS for
     clean layer separation" choice. Recommended: yes — the
     pipeline can't reach inline otherwise; non-color hooks (rx, ry,
     cursor) stay in CSS.

2. **Approve chronix-native naming `barColor` / `barBackgroundColor`
   etc.** (vs. reference's `eventColor` / `eventBackgroundColor`)?
   Chronix calls them "bars" throughout — surface naming should
   match. Recommended: yes.

3. **Approve `barColor` umbrella semantic** — sets both bg + border
   at component-prop level? Specific props (`barBackgroundColor` /
   `barBorderColor`) still win. Matches reference. Recommended:
   yes.

4. **Approve background-overrides-border umbrella for callbacks** —
   when `barBackgroundColor` resolves through any override layer
   but `barBorderColor` stays at theme default, set border to
   resolved bg? Matches reference. Recommended: yes.

5. **Approve parking `eventFontSize` / `eventFontWeight` callbacks**?
   Chronix has no bar-title text rendering; the only built-in
   text is progress label which uses theme font-size. Recommended:
   yes — revisit with bar-title text phase.

6. **Approve dropping bar-title text rendering from this phase**?
   `barTextColor` applies only to (a) progress label, (b)
   `BarSlotArgs.resolvedTextColor` for custom renderers. Bar
   title is a separate UX decision (truncation, ellipsis).
   Recommended: yes.

7. **Approve `BarStyleArg` as a narrow chronix-native subset of the
   reference's `EventContentArg`** (4 essentials + 3 defaults)?
   12 of the reference's 16 fields depend on parked infrastructure.
   Recommended: yes.

8. **Approve cross-demo color parity** (2 assertions extending
   `parity-helpers.ts`'s `extractBarsSnapshot` to include `fill`)?
   Honest visual parity for the only thing this phase changes
   (rendered fill / stroke). Recommended: yes.

9. **Approve single-commit implementation** (core resolver +
   adapter + SFC tests + demo + parity helper extension + 2
   parity tests all in one commit) + 1 wrap-up commit per parity
   discipline? Recommended: yes.

10. **Approve theme defaults `#3b82f6` / `#1e40af` / `#ffffff`**
    matching the current CSS literals? Keeps baseline render
    byte-identical. Recommended: yes.

Reply **按照推荐继续** to accept all defaults (Phase 10 amendment,
chronix-native naming, both umbrellas, font callbacks parked, bar
title parked, narrow callback arg, cross-demo color parity,
single-commit impl, theme defaults matching current CSS).
