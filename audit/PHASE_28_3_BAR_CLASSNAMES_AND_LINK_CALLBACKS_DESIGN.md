# Phase 28.3 — barClassNames + onLine + useLineEventColor + link slot

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

Three additive customization APIs from `audit/RENDER_LAYER_GAP_SWEEP_2026-05-16.md` cluster C
remained deferred after Phase 28.2 (bar text auto-render) shipped its
font cascade. Each is a small, independent surface but consumers
asking for per-bar / per-link styling have no built-in path today:

- **L.4 `barClassNamesCallback`** — k-ui's `eventClassNames` callback
  appends arbitrary CSS classes per event. Chronix's bar `<rect>`
  currently carries only `cx-gantt-bar` + `cx-gantt-bar--selected`
  (Phase 12). Consumers wanting "priority-high bar" / "overdue bar" /
  "warning-state bar" CSS hooks have to use the slot registry (Phase 11) to render a fully-custom bar element — over-scoped for the
  common case of "just add a class".
- **M.4 `onLine` callback + `useLineEventColor` boolean** — k-ui's
  per-link callback that can switch the marker / color / vertical
  offset, plus the boolean that pulls the line color from the source
  event instead of the chart-level default. Chronix's link render
  reads `LinkSpec.colorOverride` only — there's no per-render
  customization path.
- **M.6 link slot in `slotRegistry`** — chronix-additive parallel to
  Phase 11's `'bar'` slot. When a consumer needs FULL link-render
  replacement (their own custom `<path>` / multi-segment composition
  / animated tracer), the slot route is the chronix-native way.

User-flagged on the 2026-05-16 sweep as the remaining cluster C
items deferred from Phase 28.2 (per the design doc's "Phase 28.3
follow-up" disposition). The 4 user-flagged silent gaps from that
sweep are already closed across Phases 26 / 27 / 28.2 / 28.1 — this
phase covers the cluster's remaining ADDITIVE surface (no visible
silent gap; the chart works without these, they just enable common
host customizations).

## Reference (k-ui) behavior surface — full catalog

### `eventClassNames` callback

- `d:/work/k-ui/packages/gantt/src/options.ts:193` —
  `eventClassNames: ClassNamesGenerator<EventContentArg>`. Identity-
  typed in the option refiner; runtime resolution by k-ui's content-
  container helper.
- `d:/work/k-ui/packages/gantt/src/common/EventContainer.tsx:130` —
  `classNameGenerator={options.eventClassNames}` passed to
  `ContentContainer`. Inside, calls the function with the same
  `EventContentArg` the style callbacks consume (event id, title,
  resolved color, isSelected, isPast, isFuture, isToday, etc.).
- Returns `string | string[] | undefined`. Returned classes get spread
  into the event element's `class` attribute alongside k-ui's built-in
  classes (`gantt-event`, `gantt-event-selected`, `gantt-event-past`,
  etc.).

### `onLine` callback

- `d:/work/k-ui/packages/gantt/src/timeline/DependencyLineAlgorithm.ts:95` —
  `OnLineCallback = (line: DependencyLine) => DependencyLine | void`.
  Mutates the line object before path generation.
- `d:/work/k-ui/packages/gantt/src/timeline/DependencyLineAlgorithm.ts:60-76` —
  `DependencyLine` shape: `{ id, lineId, topOffset, leftOffset, type,
fromX, fromY, toX, toY, fromEventDef, toEventDef, fromResourceId,
toResourceId, points, extraVerticalOffset?, markerType?,
customMarker?, forceVerticalDown? }`. Callback can change:
  - `type` (`'square'` / `'smooth'`) — drives which routing algorithm fires
  - `markerType` (`'arrow'` / `'diamond'` / etc.) — drives marker shape
  - `customMarker` — overrides markerType with custom shape def
  - `extraVerticalOffset` — adds vertical detour distance
  - `forceVerticalDown` — flips the vertical-first direction
- `d:/work/k-ui/packages/gantt/src/resource-timeline/ResourceTimelineDependencies.tsx:1043-1048` —
  callback registered via `algorithm.registerOnLine(cb)`; algorithm
  walks `onLineCallbacks` in registration order, each callback can
  return a partial line or void (mutate in place).
- Supports array form: `onLine?: OnLineCallback | OnLineCallback[]`
  for composing multiple host-side rules.

### `useLineEventColor` boolean

- `d:/work/k-ui/packages/gantt/src/resource-timeline/ResourceTimelineDependencies.tsx:35` —
  `useLineEventColor?: boolean`. When `true`, the line's stroke
  inherits the source event's color (background fill); when `false`,
  the line uses `dependencyLineColor` (default).
- `d:/work/k-ui/packages/gantt/src/resource-timeline/ResourceTimelineDependencies.tsx:2337-2339` —
  `if (useLineEventColor && fromEventDef) lineColor =
this.getEventColor(fromEventDef, dependencyLineColor, fromResourceId)`.
  Resolution at color-collection time so marker defs get the right
  color too.

### `eventClassNames` v. bar render z-order

K-ui's `EventContainer` wraps the bar's `<rect>` + progress fill +
handles inside one `<g class="gantt-event ${eventClassNames}">`. The
class lives on the GROUP, so any descendant CSS selector
(`.gantt-event-priority-high .gantt-event-background` etc.) matches
the bar's painted rect.

Chronix's `<ChronixGantt>` emits a FLAT per-bar node list inside the
shared `<g class="cx-gantt-bars">` group — no per-bar `<g>` wrapper.
So `barClassNamesCallback`'s output must apply to the BAR RECT
specifically (the `.cx-gantt-bar` element), not a wrapper. This
matches the existing `.cx-gantt-bar--selected` modifier approach.

### Surface-level disposition table

| Item                                                                                                      | k-ui                                                                               | chronix v0                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eventClassNames(arg): string \| string[]` callback                                                       | `options.ts:193` + `EventContainer.tsx:130`                                        | ✅ **port** as `barClassNamesCallback?: (arg: BarStyleArg) => string \| readonly string[] \| undefined`. Same `BarStyleArg` shape Phase 20 introduced for color callbacks + Phase 28.2 reused for font callbacks. Return value normalized to `readonly string[]` internally; appended to the bar `<rect>`'s class attribute alongside `cx-gantt-bar` + (when selected) `cx-gantt-bar--selected`.                                                                        |
| Class scope: applies to the main bar rect, NOT to Phase 28.1's selection-border / resize-zone / dot rects | k-ui wraps in `<g>` so class affects everything inside                             | ✅ **chronix-divergent (intentional)** — chronix's flat per-bar node list means the callback's classes attach only to `.cx-gantt-bar` (the main rect). Selection visuals + resize affordances stay reserved (`cx-gantt-bar-selection-border` / `cx-gantt-bar-resizer-*`) to keep selectors stable across themes. Document explicitly in JSDoc + the cascade test pins this.                                                                                             |
| `onLine(line): DependencyLine \| void` per-link callback                                                  | `DependencyLineAlgorithm.ts:95-148` + `ResourceTimelineDependencies.tsx:1038-1062` | ✅ **port (scope-limited)** as `onLineCallback?: (arg: LinkRenderArg) => LinkRenderOverride \| undefined`. Render-time scope only: `arg` carries link metadata (linkSpec, fromBar / toBar resolved, defaultColor, currentMarker), callback returns `{ color?, marker?, extraVerticalOffset? }`. **`routing` ('square' / 'smooth') NOT mutable** in v0 — re-routing on callback output would require re-running LinkRouter, out of single-session scope. See decision 2. |
| `useLineEventColor` boolean                                                                               | `ResourceTimelineDependencies.tsx:35, 2337-2339`                                   | ✅ **port** as `useLineEventColor?: boolean` (default `false`). When `true` AND link has no `colorOverride` AND `onLineCallback` returns no `color` override, the line stroke inherits the source bar's resolved background color (Phase 20 cascade output). Marker uses the same color (for marker-def keying).                                                                                                                                                        |
| Array form for `onLine: OnLineCallback \| OnLineCallback[]`                                               | `ResourceTimelineDependencies.tsx:1044-1048`                                       | ❌ **Reject** for v0 — chronix accepts a single callback; consumers chaining rules can call them inside one function. Re-prioritize on consumer ask. Same precedent as Phase 20's color callbacks (single callback per channel, no chain).                                                                                                                                                                                                                              |
| `forceVerticalDown` callback override (in k-ui's DependencyLine)                                          | `DependencyLineAlgorithm.ts:75`                                                    | ⏸️ **Defer-indefinite** — chronix's LinkRouter doesn't model vertical-first detour direction (v0 path is always "right-of-source / left-of-target"). Add when chronix's link routing grows complex enough to need direction control.                                                                                                                                                                                                                                    |
| Mutable `customMarker` override via callback                                                              | `DependencyLineAlgorithm.ts:74`                                                    | ✅ **port** — `LinkRenderOverride.marker?: LinkMarker \| CustomLinkMarker` covers both built-in marker types and custom marker defs. Custom marker defs already in Phase 8 (`CustomLinkMarker` shape).                                                                                                                                                                                                                                                                  |
| `extraVerticalOffset` callback override                                                                   | `DependencyLineAlgorithm.ts:72`                                                    | ⏸️ **Defer-indefinite** — chronix's LinkRouter doesn't expose per-link vertical offset surface (v0 routes by bar bounds only). Re-prioritize when LinkRouter grows offset support.                                                                                                                                                                                                                                                                                      |
| Link slot in `slotRegistry`                                                                               | k-ui has no slot system                                                            | ✅ **chronix-additive** as new `LINK_SLOT_NAME = 'link'` + `LinkSlotArgs` interface in `packages/gantt/src/render/link-slot.ts`. When `slotRegistry.get('link')` returns a template, adapter invokes it per `RoutedLink` with `{ routedLink, linkSpec, fromBar, toBar, color, marker, theme }` — fully replacing the default `<path class="cx-gantt-link">` for that link. Mirrors Phase 11's bar-slot pattern.                                                         |
| Slot replaces ALL link parts (path + marker)                                                              | N/A                                                                                | ✅ **port (chronix-only)** — consumer template owns the entire rendered output. Adapter still emits `<defs>` markers for non-slot links, but the slot template is responsible for its own marker (can reuse the def by name via `marker-end="url(#cx-marker-...)`).                                                                                                                                                                                                     |
| `barClassNamesCallback` cascade fires AFTER color callbacks                                               | k-ui resolves classes from renderProps after color resolution                      | ✅ **port** — class callback runs in the same Phase 20 `resolveBarStyle` cascade slot as color/font callbacks (after layers 1-3, with the `BarStyleArg` carrying resolved defaults). Returned classes added to the `ResolvedBarStyle.classNames: readonly string[]` output field.                                                                                                                                                                                       |
| `eventFontSize` / `eventFontWeight` callbacks                                                             | already done                                                                       | ✅ **DONE (Phase 28.2)** — `barFontSize` / `barFontWeight` callbacks ship in Phase 28.2.                                                                                                                                                                                                                                                                                                                                                                                |

**Phase 28.3 net surface**: 5 ✅-port items (3 callbacks + 1 boolean +
1 slot), 2 ❌-reject for v0 (`onLine` array form; routing-type
mutation), 2 ⏸️-defer (forceVerticalDown; extraVerticalOffset).

The new chronix class names mirror the parity reference convention
with the chronix `cx-` prefix:

| k-ui                       | chronix                                                                    |
| -------------------------- | -------------------------------------------------------------------------- |
| `eventClassNames`          | `barClassNamesCallback` (component prop)                                   |
| `onLine`                   | `onLineCallback` (component prop)                                          |
| `useLineEventColor`        | `useLineEventColor` (component prop — boolean, kept verbatim)              |
| (slot — N/A)               | `'link'` slot name in `slotRegistry` (chronix-additive)                    |
| `OnLineCallback` type      | `LinkRenderFunc = (arg: LinkRenderArg) => LinkRenderOverride \| undefined` |
| `DependencyLine` shape     | `LinkRenderArg` (chronix-named; render-time fields only)                   |
| (return: `DependencyLine`) | `LinkRenderOverride` (partial override bag — color / marker only v0)       |

## Approach

### Core: `BarColorFunc` family expansion — `packages/gantt/src/api/bar-style.ts`

Add `BarClassNamesFunc` type alongside the existing `BarColorFunc` /
`BarFontSizeFunc` / `BarFontWeightFunc`:

```ts
/**
 * Phase 28.3: per-bar class-names callback. Returns a CSS class
 * string, an array of class strings, or `undefined` to add no
 * extra classes. Returned classes append to the `.cx-gantt-bar`
 * rect's existing class list (`cx-gantt-bar` + optionally
 * `cx-gantt-bar--selected`).
 */
export type BarClassNamesFunc = (arg: BarStyleArg) => string | readonly string[] | undefined;
```

Extend `ResolvedBarStyle` with a `classNames: readonly string[]` field:

```ts
export interface ResolvedBarStyle {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly textColor: string;
  readonly fontSize: number;
  readonly fontWeight: number | string;
  /**
   * Phase 28.3: extra class names from `barClassNamesCallback`.
   * Empty array when no callback set or callback returned undefined.
   * Normalized form — string callbacks are wrapped, undefined → [].
   */
  readonly classNames: readonly string[];
}
```

Extend `ResolveBarStyleInput` with the callback field:

```ts
export interface ResolveBarStyleInput {
  // ... existing ...
  // Phase 28.3 NEW:
  readonly barClassNamesCallback?: BarClassNamesFunc;
}
```

Resolver invokes the callback in the same Layer-4 callback block
(after color + font cascades), normalizes the return into a
`string[]`, returns it on `ResolvedBarStyle.classNames`.

### Core: link slot module — `packages/gantt/src/render/link-slot.ts`

New file paralleling `bar-slot.ts`:

```ts
import type { ChronixTheme } from '../api/chronix-theme.js';
import type { CustomLinkMarker, LinkMarker, LinkSpec } from '../ir/index.js';
import type { PlacedBar, RoutedLink } from '../layout/types.js';

/**
 * Args bag passed as `SlotContext.args` when the `'link'` slot fires.
 * Each routed link gets one invocation per render pass; the template's
 * return is the framework's VNode shape for the entire link render
 * (the default `<path class="cx-gantt-link">` is replaced when a
 * template is registered).
 *
 * `fromBar` / `toBar` are the resolved `PlacedBar` references the
 * link connects. They're populated whenever `RoutedLink.linkId`'s
 * source `LinkSpec` resolved both endpoints — orphan links (which
 * don't make it into `routedLinks`) never reach the slot.
 *
 * `color` is the resolved line color: `colorOverride` from the spec,
 * OR (when `useLineEventColor: true`) the source bar's resolved
 * background, OR the theme default. `marker` is the resolved marker
 * shape after any `onLineCallback` override.
 *
 * `theme` is the adapter's merged theme. Custom renderers consult
 * it for stroke widths / colors so visuals stay coordinated with
 * the rest of the chart.
 */
export interface LinkSlotArgs {
  readonly routedLink: RoutedLink;
  readonly linkSpec: LinkSpec;
  readonly fromBar: PlacedBar;
  readonly toBar: PlacedBar;
  readonly color: string;
  readonly marker: LinkMarker | CustomLinkMarker;
  readonly theme: ChronixTheme;
}

export const LINK_SLOT_NAME = 'link';
```

Export from `packages/gantt/src/render/index.ts` + re-export from
`packages/gantt/src/index.ts` alongside `BAR_SLOT_NAME` /
`BarSlotArgs`.

### Core: link-render override types — `packages/gantt/src/api/link-render.ts`

New file for the per-link callback infrastructure:

```ts
import type { CustomLinkMarker, LinkMarker, LinkSpec } from '../ir/index.js';
import type { PlacedBar, RoutedLink } from '../layout/types.js';

/**
 * Argument bag passed to `onLineCallback`. Chronix-native shape;
 * carries the resolved geometry + per-link metadata available at
 * render time so the host can decide marker / color / extra offset
 * per link.
 *
 * `fromBar` / `toBar` are the resolved `PlacedBar`s. `defaultColor`
 * is the line color BEFORE the callback runs (= `colorOverride` if
 * set OR the source bar color when `useLineEventColor`, else theme
 * default). `currentMarker` is the marker the link would have rendered
 * with absent the callback (= `LinkSpec.marker`).
 */
export interface LinkRenderArg {
  readonly routedLink: RoutedLink;
  readonly linkSpec: LinkSpec;
  readonly fromBar: PlacedBar;
  readonly toBar: PlacedBar;
  readonly defaultColor: string;
  readonly currentMarker: LinkMarker | CustomLinkMarker;
}

/**
 * Partial override returned by `onLineCallback`. Each field replaces
 * the corresponding default when present; omitted fields fall through
 * to the layered default. v0 scope: color + marker only. The k-ui
 * reference's `routing`-mutable callback is rejected for v0 (would
 * require re-running LinkRouter); `extraVerticalOffset` is deferred
 * pending router support.
 */
export interface LinkRenderOverride {
  readonly color?: string;
  readonly marker?: LinkMarker | CustomLinkMarker;
}

/**
 * Render-time per-link callback. Returns `undefined` (or omits any
 * field) to accept the default cascade. Single callback per chart
 * — consumers chaining rules call them inside one function.
 */
export type LinkRenderFunc = (arg: LinkRenderArg) => LinkRenderOverride | undefined;
```

Export from `packages/gantt/src/api/index.ts` + `packages/gantt/src/index.ts`.

### Adapter: thread Phase 28.3 surface into render — `adapters/vue3/src/chronix-gantt.ts`

1. **Component props (add 3 fields)**:

   ```ts
   barClassNamesCallback?: BarClassNamesFunc;
   onLineCallback?: LinkRenderFunc;
   useLineEventColor?: boolean;
   ```

2. **Bar render block** (per-bar flatMap closure):
   - Pass `barClassNamesCallback` into `resolveBarStyle()` call.
   - Read `resolvedStyle.classNames` and append to bar `<rect>`'s
     class attribute (`cx-gantt-bar` + selected modifier + custom
     classes).

3. **Link render block** (after `routedLinks.value.map(...)`):
   - Build `placedBarById: Map<string, PlacedBar>` (cheap, reuses
     existing `placedBars.value`).
   - For each `routed: RoutedLink`:
     - Resolve `fromBar` + `toBar` from `placedBarById` (skip if
       missing — defensive; should never happen for non-orphan
       routed links).
     - Compute `baseColor`:
       - `routed.color` (= `LinkSpec.colorOverride`) takes
         precedence.
       - Else if `props.useLineEventColor` AND `fromBar` is in the
         `barColorByBarId` (built once per render from resolved bar
         styles), use that.
       - Else `t.linkDefaultColor`.
     - Compute `baseMarker`: `linkSpec.marker`.
     - If `props.onLineCallback` set: build `LinkRenderArg`, invoke,
       merge `{ color, marker }` overrides.
     - If `slotRegistry?.get(LINK_SLOT_NAME)`: invoke template,
       push returned VNode(s); skip the default `<path>` for this
       link.
     - Else: emit default `<path class="cx-gantt-link">` with the
       resolved color / marker.

4. **Marker defs collection** — `usedColors` set must include the
   POST-callback / post-event-color colors so `<marker>` defs get
   built for the right pairs. Compute the resolved color per link
   BEFORE the defs-collection loop. Same for `customMarker` overrides
   from the callback.

### Sample consumer

```vue
<template>
  <ChronixGantt
    :bars="bars"
    :links="links"
    :rows="rows"
    :axis-input="axisInput"
    :bar-class-names-callback="
      (arg) =>
        arg.bar.extensions?.priority === 'high' ? ['priority-high', 'attention-glow'] : undefined
    "
    :on-line-callback="
      (arg) =>
        arg.linkSpec.id === 'critical-path' ? { color: '#ef4444', marker: 'diamond' } : undefined
    "
    :use-line-event-color="true"
  />
</template>

<style>
.priority-high {
  stroke: #ef4444;
  stroke-width: 2;
}
.attention-glow {
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.4));
}
</style>
```

3 customization paths from one phase: class hooks for CSS-driven
visual variants, per-link marker / color override for highlighting
critical paths, and chart-wide "lines inherit from source bar" toggle
for color-coded dependency graphs.

### Alternatives considered

- **`onLineCallback` returns full `RoutedLink`** (matches k-ui's
  return-DependencyLine shape) — Reject. RoutedLink carries the
  `pathD` string; letting callbacks rewrite arbitrary path strings
  opens a wide surface (validation, marker-end re-resolution,
  potentially path injection if pathD isn't sanitized in
  consumer code). v0's partial-override bag is safer + cheaper to
  test.
- **`barClassNamesCallback` returns object form `{ classes,
attrs?, data? }`** — Reject. K-ui's callback returns only classes;
  staying parity matches the upstream contract. Per-bar `data-`
  attributes / element attrs are a separate surface (out of scope).
- **Move `useLineEventColor` to `ChronixTheme`** — Reject.
  Boolean defaults that toggle algorithmic behavior live on the
  component prop surface, not the theme (theme is for visual tokens —
  colors, sizes, fonts). Same precedent as `editable` / `selectable`.
- **Bundle Phase 28.3 with Phase 29 (per-day CSS classes)** —
  Reject. Different render branches (bar vs day cell); Phase 29 also
  needs a new layout-pass concern (per-day class derivation from
  axis ticks). Single-session discipline per
  `feedback_quality_acceleration.md` constraint #3.

## Parity assertion plan — MANDATORY

This phase modifies `packages/gantt/src/api/bar-style.ts` (cascade
extension), adds `packages/gantt/src/api/link-render.ts` (new types),
`packages/gantt/src/render/link-slot.ts` (chronix-additive), AND
`adapters/vue3/src/chronix-gantt.ts` (render). The bar render path
gains a `classNames` cascade slot — algorithm code.

**chronix-additive surfaces, NO cross-demo parity for callbacks /
slot path itself.** The 3 callback surfaces + the slot are
chronix-additive customization APIs the parity reference doesn't
exercise in its default demo. To cross-demo-test them, we'd need
both sides to wire identical `eventClassNames` / `onLine` / link
slot — adds parity-oracle modifications + chronix-side demo
config, out of single-session scope.

**`useLineEventColor`** IS cross-demo-testable structurally because
k-ui's demo enables `useLineEventColor: true` by default (per
`d:/work/k-ui/examples/gantt/vue3/src/DemoApp.vue:1300`). Adding
chronix demo's parity mode toggle to match exercises the same path
on both sides; cross-demo link color-set parity asserts equivalence.

| Assertion id (in parity.spec.ts)                                      | Drives k-ui demo via                                      | Drives chronix demo via   | Compares                                                                                                                                                                                                                                                                                                                                       | Tolerance    |
| --------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `phase28.3-useLineEventColor link-color set parity (week view)`       | `loadBothDemos` (k-ui defaults `useLineEventColor: true`) | parity mode + same toggle | Set of distinct stroke colors used across all `.cx-gantt-link` / `.gantt-dependency-line` paths. With `useLineEventColor: true` on both sides + identical bar colors (parity fixture), the colorsets should match. Demonstrates that chronix's source-bar-color lookup produces the same value the parity reference's `getEventColor` returns. | Set equality |
| `phase28.3-useLineEventColor marker-def color set parity (week view)` | same                                                      | same                      | Set of `<marker>` def `fill` / `stroke` colors. Each per-link color spawns one `<marker>` def per marker shape; both sides should emit the same color set.                                                                                                                                                                                     | Set equality |

The 2 callbacks + the slot get pinned by adapter unit tests (cross-
demo parity infeasible without parity-oracle config changes — same
architectural pattern as Phase 28.1's selection-state parity
deferral).

### Drift-detection scope

- **Covered**: source-bar-color → link-color resolution chain for
  `useLineEventColor: true`. Marker def color generation. Both
  exercise the cascade `colorOverride > useLineEventColor ?
sourceBar.bg : theme.linkDefaultColor`.
- **NOT covered (cross-demo)**:
  - `barClassNamesCallback` behavior — chronix-only adapter tests
    (parity reference's eventClassNames isn't wired in its demo).
  - `onLineCallback` behavior — same; pinned by adapter tests.
  - Link slot — chronix-additive (no parity equivalent).
- **NOT covered (adapter)**: VRT pixel parity. The callback path
  output depends on consumer-provided functions; VRT screenshots
  cover the static-default visual which is unchanged by these
  additions.

## Test coverage

- **core** — `packages/gantt/src/api/bar-style.test.ts` (+6 tests):
  - "resolveBarStyle returns empty `classNames` when no callback set"
  - "barClassNamesCallback returning a string wraps to single-entry array"
  - "barClassNamesCallback returning an array passes through"
  - "barClassNamesCallback returning undefined → empty array"
  - "barClassNamesCallback receives the same BarStyleArg color/font callbacks do"
  - "class callback fires in same cascade slot as color/font callbacks"
- **core** — `packages/gantt/src/api/link-render.test.ts` (new, ~5 tests):
  - "LinkRenderArg type-checks shape carries routedLink + linkSpec + fromBar + toBar + defaultColor + currentMarker"
  - "LinkRenderOverride accepts color-only / marker-only / both / undefined"
  - "type LinkRenderFunc accepts (arg) => override and (arg) => undefined"
  - "marker override accepts both LinkMarker built-ins AND CustomLinkMarker"
  - "callback type can be assigned without explicit type parameter at call site"
- **core** — `packages/gantt/src/render/link-slot.test.ts` (new, ~3 tests):
  - "LINK_SLOT_NAME exported as 'link' constant"
  - "LinkSlotArgs type-checks required fields (routedLink, linkSpec, fromBar, toBar, color, marker, theme)"
  - "slotRegistry.register(LINK_SLOT_NAME, ...) round-trips"
- **adapter** — `adapters/vue3/src/chronix-gantt-bar-classnames.test.ts` (new, ~6 tests):
  - "no extra classes when no callback set"
  - "callback returning ['warn'] adds class to bar rect"
  - "callback returning 'priority-high' (string) adds single class"
  - "callback returning undefined leaves bar rect with only default classes"
  - "callback classes coexist with cx-gantt-bar--selected modifier"
  - "callback classes do NOT appear on selection-border / resize-zone / dot rects"
- **adapter** — `adapters/vue3/src/chronix-gantt-link-callbacks.test.ts` (new, ~8 tests):
  - "useLineEventColor: true uses source bar's resolvedBackgroundColor as line stroke"
  - "useLineEventColor: false uses theme.linkDefaultColor"
  - "LinkSpec.colorOverride wins over useLineEventColor"
  - "onLineCallback returning {color: '#ef4444'} overrides defaults"
  - "onLineCallback returning {marker: 'diamond'} overrides LinkSpec.marker"
  - "onLineCallback returning undefined leaves defaults intact"
  - "onLineCallback color override wins over useLineEventColor"
  - "marker def emitted for the callback-overridden color (not the default)"
- **adapter** — `adapters/vue3/src/chronix-gantt-link-slot.test.ts` (new, ~4 tests):
  - "no slot template → emits default `<path class='cx-gantt-link'>`"
  - "registered link slot template invokes per routed link with full LinkSlotArgs"
  - "slot template's returned VNode replaces the default path"
  - "slot fires AFTER color resolution (args.color reflects useLineEventColor + onLine override)"
- **parity** — `tooling/golden-runner/tests/parity.spec.ts` (+2 assertions):
  Per the table above — useLineEventColor link-color set parity +
  marker-def color set parity.

Expected counts after Phase 28.3:

- vitest 582 → ~614 (+32: 6 + 5 + 3 core + 6 + 8 + 4 adapter).
- parity-spec 51 → 53 (+2 phase28.3-useLineEventColor-\*).
- ChronixTheme tokens 50 unchanged.
- cross-demo verify scenarios 27 unchanged (parity-mode demo
  toggle change might require 1-2 baseline re-captures for the
  link-color-set delta).

## VRT impact

- **chronix-visual baselines** (5): zero pixel change in the default
  demo state (no callbacks wired in chronix's demo by default; default
  `useLineEventColor: false`). No re-baseline.
- **cross-demo VRT baselines** (27): no re-baseline expected for the
  same reason. The 2 new parity assertions use `?parity=true` mode
  to enable `useLineEventColor` on both sides — that mode change is
  test-only and doesn't drive any existing VRT scenario.
- **NEW cross-demo scenario** (if needed): the `useLineEventColor`
  toggle may warrant a `vrt-week-useLineEventColor` baseline pair to
  capture the per-link color variation visually. Decision in Commit
  4 if assertions reveal visible divergence.

Predicted re-baseline count: 0-2 PNGs.

## Execution plan — 4 commits + wrap-up

### Commit 1 (design doc, this commit) — REQUIRES user review of 3 load-bearing decisions

Lands only `audit/PHASE_28_3_BAR_CLASSNAMES_AND_LINK_CALLBACKS_DESIGN.md`.
Awaits user confirmation of the 3 decisions in "Open questions"
before implementation.

### Commit 2: Core — `BarClassNamesFunc` + cascade extension + `LinkRenderArg/Override/Func` + link-slot module + ~14 core tests

- `packages/gantt/src/api/bar-style.ts`: add `BarClassNamesFunc`
  type, extend `BarStyleArg` (no change — same arg), extend
  `ResolvedBarStyle.classNames`, extend `ResolveBarStyleInput.
barClassNamesCallback`, wire callback into Layer 4 cascade slot
  - class-normalization helper.
- `packages/gantt/src/api/bar-style.test.ts`: +6 tests for classNames
  cascade.
- `packages/gantt/src/api/link-render.ts` (new): `LinkRenderArg`,
  `LinkRenderOverride`, `LinkRenderFunc` types.
- `packages/gantt/src/api/link-render.test.ts` (new): +5 type tests.
- `packages/gantt/src/api/index.ts`: re-export the 3 new types.
- `packages/gantt/src/render/link-slot.ts` (new): `LinkSlotArgs`,
  `LINK_SLOT_NAME`.
- `packages/gantt/src/render/link-slot.test.ts` (new): +3 tests.
- `packages/gantt/src/render/index.ts`: re-export.
- `packages/gantt/src/index.ts`: top-level re-exports.
- Rebuild `@chronixjs/gantt` dist.
- ci-check green (vitest 582 → ~596).

### Commit 3: Adapter — 3 new props + bar-class-attribute extension + link-render rewrite + ~18 adapter tests

- `adapters/vue3/src/chronix-gantt.ts`:
  - Add 3 component props (`barClassNamesCallback`, `onLineCallback`,
    `useLineEventColor`).
  - Thread `barClassNamesCallback` into `resolveBarStyle()` call;
    read `resolvedStyle.classNames` and merge into bar `<rect>`'s
    class attribute.
  - Build per-render `placedBarById` lookup + `barColorByBarId`
    lookup (for useLineEventColor).
  - Rewrite link-path render block to resolve color via
    `routed.color → useLineEventColor source → theme.linkDefaultColor`
    cascade, then invoke `onLineCallback` for marker / color
    overrides, then check `slotRegistry.get('link')` for full
    replacement.
  - Update marker `<defs>` collection to use post-callback resolved
    colors + post-callback resolved customMarker shapes.
- `adapters/vue3/src/chronix-gantt-bar-classnames.test.ts` (new, ~6
  tests).
- `adapters/vue3/src/chronix-gantt-link-callbacks.test.ts` (new, ~8
  tests).
- `adapters/vue3/src/chronix-gantt-link-slot.test.ts` (new, ~4 tests).
- Rebuild `@chronixjs/gantt-vue3` dist.
- ci-check green (vitest 596 → ~614).

### Commit 4: Parity assertions + parity-mode useLineEventColor wiring + VRT re-check

- `tooling/golden-runner/src/reference-dom-map.ts`: 1 new selector
  (`LINK_MARKER_DEF` for marker `<marker>` color reads — k-ui side
  matches via attribute-selector).
- `tooling/golden-runner/tests/parity.spec.ts`: +2 useLineEventColor
  count parity assertions.
- `examples/gantt-vue3/src/App.vue` + parity-mode wiring: thread
  `?useLineEventColor=true` URL flag in parity mode so cross-demo
  assertions can enable the toggle on chronix's side (parity
  reference's demo defaults to `true`).
- Run cross-demo verify + chronix-visual verify; re-capture any
  baselines that show useLineEventColor effects.
- ci-check green; cross-demo-verify gate green (27/27 + any new
  baselines).

### Commit 5 (wrap-up — REQUIRES /phase-close invocation)

- `audit/journal/2026-05-13.md`: "Phase 28.3 — barClassNames + onLine
  - useLineEventColor + link slot (DONE, YYYY-MM-DD)" section.
- `memory/project_gantt_rewrite_plan.md`: bump vitest 582 → ~614;
  parity-spec 51 → 53; theme tokens 50 unchanged; add Phase 28.3
  DONE marker.
- `audit/PHASE_28_3_BAR_CLASSNAMES_AND_LINK_CALLBACKS_DESIGN.md`
  Status → DONE.

## Estimated scope

| Commit                                           | Hours | LOC est.                                                          |
| ------------------------------------------------ | ----- | ----------------------------------------------------------------- |
| 1 (design doc)                                   | 1     | this file (~600 LOC)                                              |
| 2 (core: cascade ext + 2 new modules + 14 tests) | 2     | ~160 LOC src + ~220 LOC tests                                     |
| 3 (adapter: 3 props + render rewrite + 18 tests) | 2.5   | ~220 LOC src + ~380 LOC tests                                     |
| 4 (parity + VRT re-check)                        | 1     | ~80 LOC parity tests + ~30 LOC parity-mode wiring + 0-2 baselines |
| 5 (wrap-up)                                      | 0.5   | journal + memory + status flip                                    |
| **Total**                                        | **7** | ~1090 LOC + ~0-2 baseline PNGs                                    |

Within single-session discipline (per
`feedback_quality_acceleration.md` constraint #3). Slightly over the
5-6h estimate from the RENDER_LAYER_GAP_SWEEP cluster-C-remainder
row, because 3 chronix-additive surfaces means more separate test
files (one per surface).

## 4-dimension audit check

| Dimension                     | Coverage in Phase 28.3                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Options surface**           | 3 new component-prop callbacks/booleans (`barClassNamesCallback`, `onLineCallback`, `useLineEventColor`). New core types (`BarClassNamesFunc`, `LinkRenderArg`, `LinkRenderOverride`, `LinkRenderFunc`). New slot constant (`LINK_SLOT_NAME`). No new theme tokens.                                               |
| **Render code**               | Bar `<rect>` class attribute gains a normalized append from the callback's return. Link `<path>` color / marker resolution path rewritten to walk `colorOverride → useLineEventColor → theme` + invoke `onLineCallback` + check slot registry. Marker `<defs>` collection consumes post-callback resolved values. |
| **Interaction code**          | Zero impact. The callback values feed render only; pointer / hit-test paths untouched. Custom classes from `barClassNamesCallback` are NOT consumed by hit-test (hit-test reads `data-bar-id`).                                                                                                                   |
| **Layout-algorithm pipeline** | Zero impact. `BarStyleArg` shape unchanged. `LinkRouter` unchanged (callback runs at adapter render-time, after routing). `RoutedLink` shape unchanged. No PlacedBar field additions.                                                                                                                             |

## Open questions for the user — 3 load-bearing decisions

**1. Scope: A (full bundle — `barClassNamesCallback` + `onLineCallback` + `useLineEventColor` + link slot) / B (drop link slot, ship 3 callbacks only) / C (drop `onLineCallback`, ship `barClassNamesCallback` + `useLineEventColor` + link slot)** — recommended **A**.

- **A (recommended)**: all 4 surfaces. ~7h total. Each surface has
  trivial cascade slot in `resolveBarStyle` (class callback) OR
  adapter-render-only impact (`onLine` / `useLineEventColor` / link
  slot). Sharing the work in one phase amortizes the design overhead.
- **B**: 3 callbacks, defer link slot. -1h. Cost: consumers wanting
  full link-render replacement still have no path. Bundles naturally
  with `'link'` slot — splitting feels arbitrary.
- **C**: drop `onLineCallback`. -1.5h. Loses per-link marker /
  color customization. The `useLineEventColor` boolean covers the
  "all lines inherit from source" case but not the "this ONE link
  needs to look different" case (consumer ask is common for
  highlighting critical paths).

**Recommendation**: **A**. All 4 surfaces are additive + independent; no shared mid-phase findings risk
(cf. Phase 28.1's parity-oracle selection-model surprise). Single phase,
clean delivery.

**2. `onLineCallback` scope: A (render-time only — color, marker, NOT routing-type; matches k-ui's `DependencyLine.markerType` mutation but not `DependencyLine.type` mutation) / B (full k-ui parity — callback can also change `routing: 'square' | 'smooth'`, requires re-routing the link)** — recommended **A**.

- **A (recommended)**: callback fires at adapter render-time AFTER
  `LinkRouter` ran. Returns `{ color?, marker? }`. Re-routing on
  output not supported. Simple impl: ~30 LOC adapter, no core
  change. Covers the common use case (highlight critical path: change
  color + marker; switch dashed style: not in scope; consumers can use
  per-spec `LinkSpec.routing` for chart-wide override).
- **B**: callback fires inside LinkRouter (core change), routing
  recomputes if `routing` changes. Adds ~60 LOC core + caching complications
  (pure-function LinkRouter currently). 2× test surface. Out of single-
  session scope.

**Recommendation**: **A**. K-ui's most common host use of `onLine` is
marker / color (`useLineEventColor` + per-edge `{ markerType }`);
routing-type mutation is uncommon. Re-prioritize on consumer ask.

**3. `barClassNamesCallback` scope: A (class affects ONLY the main `<rect class="cx-gantt-bar">` rect, NOT Phase 28.1's selection-border / resize-zone / dot rects) / B (class wraps ALL per-bar elements via a new `<g>` parent — closer to k-ui's group-class pattern) / C (additionally affect Phase 27's continuation-triangle polygons + Phase 28.2's title text)** — recommended **A**.

- **A (recommended)**: callback's classes attach to `.cx-gantt-bar`
  only. Phase 28.1's selection-border / resize-zone / dot rects keep
  stable, themed selectors (`.cx-gantt-bar-selection-border`, etc.) that
  don't co-mingle with consumer classes. Consumer CSS targets
  `.priority-high { ... }` and styles the bar's fill / stroke;
  selection / resize visuals stay theme-controlled.
- **B**: chronix per-bar render gains a `<g>` wrapper carrying the
  custom classes. All descendant per-bar elements pick up the class
  via CSS descendant combinator. **Cost**: structural change (chronix
  currently emits a flat per-bar node list; adding a `<g>` changes
  the DOM contract assumed by adapter tests + cross-demo VRT). Higher
  fidelity to k-ui but risks regressions.
- **C**: callback's classes apply to bar rect + triangles + title.
  Inconsistent: the resize visuals stay separate. Confusing semantics
  for consumers.

**Recommendation**: **A**. The chronix-divergence (class-on-rect vs
class-on-group) is intentional and aligns with chronix's existing flat-
per-bar-render pattern. Consumers using CSS to style by class can still
do `.priority-high.cx-gantt-bar { stroke: red }` — full control of the
main bar rect.

Reply **按推荐继续** to accept all three (A / A / A), or call out
any 1-3 to override.
