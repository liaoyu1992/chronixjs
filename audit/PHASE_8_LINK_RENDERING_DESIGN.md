# Phase 8 — Link rendering in `<ChronixGantt>` (SVG `<path>` + markers)

**Status**: **DONE (2026-05-15)**. Landed as 4 commits: `5a932d1`
(design doc) → `5f07a6b` (Commit 1: paths) → `65088ce` (Commit 2:
markers + colorOverride) → `d4688b0` (Commit 3: demo + VRT
rebaseline). 14 new SFC tests; vue3 adapter 110 → 124. See
`audit/journal/2026-05-13.md` "Phase 8" section for the post-mortem
including the smooth-backward sample-data bug that crashed the demo
on first wire-up.

## Problem

Phase 7 closed the routing-layer gap: `defaultLinkRouter` now emits
SVG path strings + marker positions for both `'square'` and forward
`'smooth'` routings. **But the `<ChronixGantt>` Vue3 adapter still
ignores links entirely** — it doesn't read `LinkSpec` from any prop,
doesn't call `defaultLinkRouter.route(...)`, and emits no `<path>`
elements. The reference demo at port 8701 shows dozens of dependency
arrows; the chronix demo at port 8702 shows none. This is the single
most visible parity gap right now.

This phase fills the render-layer gap. After it, a consumer can pass
`<ChronixGantt :links="...">` and see real arrows on the chart.

## Reference (k-ui) behavior surface — full catalog

Walked `packages/gantt/src/timeline/TimelineDependencies.tsx`,
`packages/gantt/src/timeline/DependencyLineAlgorithm.ts`,
`packages/gantt/src/resource-timeline/GanttView.tsx`,
`packages/gantt/src/resource-timeline/ResourceTimelineDependencies.tsx`,
and `examples/gantt/vue3/src/DemoApp.vue` to enumerate every link-
rendering sub-behavior. Each item is marked ✅ done / ⏸️ parked /
❌ rejected for Phase 8.

### Routing geometry

1. ✅ **Square 3-segment elbow** (`from.x → from.x+nub → vert → to.x`)
   — already in `defaultLinkRouter` since Phase 2.
2. ✅ **Smooth forward (same-row)** straight `L` line — Phase 7.
3. ✅ **Smooth forward (cross-row)** cubic Bézier `C` + horizontal `L`
   — Phase 7.
4. ⏸️ **Smooth backward (target on left)** compound `C`+`S` detour —
   parked at routing layer; reference demo doesn't exercise it.
5. ⏸️ **Square + same-row + target-on-left** detour with vertical
   clearance — parked; chronix demo has no backward links.
6. ⏸️ **Clipped-edge variants** (target's left edge past viewport →
   marker arrives vertically from above/below) — parked; chronix has
   no clipping pipeline yet (`isClippedStart` / `isClippedEnd` only
   meaningful inside a virtualized viewport).
7. ⏸️ **Pseudo-clipped adjacency** (two same-row events nearly
   touching → treat as clipped to keep marker visible) — parked;
   depends on `pseudoLeftClippedInstances` set k-ui builds at render
   time.
8. ⏸️ **`forceVerticalDown`** for square paths whose source is near
   the timeline top — parked; cosmetic, demo doesn't show it.
9. ⏸️ **Marker grouping with vertical / horizontal offset** when
   multiple links target the same bar (dedupe markers, offset
   visually) — parked; chronix v0 renders one `<path>` per link with
   its own marker, regardless of collisions.

### Marker shapes

10. ✅ **7 built-in marker types** — `arrow`, `diamond`,
    `diamond-hollow`, `circle`, `circle-hollow`, `pointer`, `plus`.
    All already enumerated in chronix's `LinkMarker` type. Geometry
    ports verbatim from `renderMarker` in `TimelineDependencies.tsx`
    (lines 519–663): all 4.5×4.5 with `markerUnits="strokeWidth"`,
    `overflow="visible"`. See **Marker SVG fragments** appendix
    below.
11. ✅ **`'none'`** explicit no-marker — already in `LinkMarker`
    union; the `<path>` simply omits `marker-end`.
12. ✅ **`CustomLinkMarker`** user-supplied SVG fragment — chronix's
    `LinkSpec.marker` already accepts the discriminated `string |
CustomLinkMarker` union; render layer dispatches.
13. ⏸️ **Per-direction marker variants** (`horizontal` / `vertical-up`
    / `vertical-down`) — parked; chronix v0 only emits horizontal
    forward links, so all markers point right.
14. ⏸️ **`onLine` callback** to mutate `markerType` per-link at
    render time — rejected; chronix prefers static `LinkSpec.marker`
    on the IR. Consumers re-derive their `links` array reactively
    instead of mutating during render.

### Stroke + color

15. ✅ **Chart-level default color** (k-ui's `dependencyLineColor`,
    defaults `#3788d8`) — port as new `<ChronixGantt>` prop
    `defaultLinkColor: string` (default `#3788d8`).
16. ✅ **Per-link `colorOverride`** — already on `LinkSpec`;
    `defaultLinkRouter` already passes it through to
    `RoutedLink.color`.
17. ✅ **Stroke width 1.5** — port verbatim as a constant inside
    `<ChronixGantt>`. No prop in v0; can promote later if a consumer
    needs to override.
18. ⏸️ **`useLineEventColor` toggle** (line color = source bar's
    color) — parked; chronix `BarSpec` has no color/styling field
    yet. When chronix grows bar coloring, the prop joins. v0
    workaround: a consumer can derive `LinkSpec.colorOverride` from
    their own bar-color logic.
19. ❌ **`stroke-dasharray`** — rejected; k-ui doesn't use it. Solid
    stroke only.

### Marker rendering strategy

20. ✅ **`<defs>` + `marker-end="url(#...)"`** — chosen approach. One
    `<marker>` def per (markerType × color) pair, deduped by Set.
    Path `marker-end` references it. `markerUnits="strokeWidth"`
    auto-scales with stroke. `orient="auto"` derives angle from the
    last path segment — chronix's forward paths always end in a
    horizontal `L`, so `auto` yields 0° marker rotation, matching
    `RoutedLinkMarker.angleDeg`.

    **Alternative considered**: inline `<polygon>` / `<path>` at
    `(marker.x, marker.y) transform="rotate(${angleDeg})"`. Pros:
    consumes `RoutedLinkMarker.x/y/angleDeg` directly; easier to
    test. Cons: doesn't reuse SVG marker infrastructure; more
    DOM nodes; diverges from k-ui. **Rejected** for v0 — the
    `<defs>+marker-end` path is SVG-idiomatic and parity-matching.

    `RoutedLinkMarker` stays on the routing output: it's still
    useful for off-DOM renderers (canvas / VRT pixel probes) and
    keeps the layout layer independent of the render strategy.

### DOM structure + z-order

21. ✅ **Render after bars in body SVG, so links paint on top**.
    k-ui renders dependency lines in a separate absolute-positioned
    `<div class="gantt-dependency-lines-layer">` at `zIndex: 2`,
    above the bar SVG at `zIndex: 1`. Chronix already has a single
    `<svg class="cx-gantt-body">` containing `<g class="cx-gantt-bars">`;
    add a sibling `<g class="cx-gantt-links">` rendered AFTER the
    bars group so SVG paint order puts it on top. (k-ui uses a
    separate SVG; chronix folds it into the same SVG to keep one
    coordinate system. The visual effect is identical because both
    coordinate systems share the body-content origin and the link
    SVG has the same dimensions as the body SVG.)
22. ✅ **`pointer-events: none` on the link group** — k-ui's
    dependency SVG sets `pointer-events: none`; chronix's link
    `<g>` does the same so bar drag/resize/progress-handle pointer
    events pass through unaffected.
23. ⏸️ **Link `<g>` per-link CSS classes** (`gantt-dependency-line`
    on each path, `arrow` on the wrapping `<g>`) — partially done.
    Each chronix path gets `class="cx-gantt-link"` and is wrapped
    in `<g class="cx-gantt-link-arrow">`. Names diverge per the
    chronix `cx-` prefix discipline.

### Interactivity

24. ❌ **Hover / selected state on links** — rejected; k-ui doesn't
    implement either. The dependency SVG is `pointer-events: none`
    end-to-end. If a consumer demands link selection, that's a
    Phase 9+ feature.
25. ❌ **Click-to-delete / right-click menu** — rejected for the
    same reason.

### Performance

26. ⏸️ **Memoization of marker `<defs>`** — k-ui regenerates the full
    `<defs>` tree on every render (verified by reading the `render()`
    method top-to-bottom). chronix v0 follows the same naive
    approach; render is already cheap (5–20 links × 7 marker types
    × ≤4 colors = ≤140 `<marker>` nodes worst case). Memo can land
    later if profiling shows hot spots.
27. ⏸️ **Mirror placements during drag** (live link update while a
    bar drags) — parked; depends on chronix gaining a drag-preview
    pipeline. For now, links freeze at the pre-drag layout and
    snap to the new layout on commit (which is what happens
    naturally because `placedBars` recomputes on commit).

## Approach

### Component API after Phase 8

`<ChronixGantt>` gains:

```ts
// New prop
links?: readonly LinkSpec[]; // default []
defaultLinkColor?: string;   // default '#3788d8'

// New emit (warn-only)
'link-orphan': (linkId: string) => void;
```

A `LinkSpec` whose `fromBarId` or `toBarId` doesn't resolve to a
placed bar is silently dropped from rendering but emitted as
`link-orphan` so a consumer can wire telemetry / dev warnings. Also
`console.warn` in dev once per orphan id (suppressed in production
via `import.meta.env.PROD` if the bundler injects it; otherwise a
plain `console.warn` always-on, since chronix has no env split
today).

`LinkSpec` and `RoutedLink` types stay the same — Phase 7 already
froze them. `RoutedLinkMarker` stays even though `marker-end="..."`
makes it redundant in the SVG path (see catalog item 20 for why).

### Render pipeline

In `<ChronixGantt>` setup:

```ts
const routedLinks = computed(() => {
  const result = defaultLinkRouter.route({
    links: props.links,
    placedBars: placedBars.value,
  });
  for (const orphanId of result.orphanLinkIds) {
    emit('link-orphan', orphanId);
    console.warn(`[chronix] Link "${orphanId}" references unknown bar(s); dropped.`);
  }
  return result.routedLinks;
});
```

In the render function:

```ts
// Build the marker <defs> from the set of (markerType × color) pairs
// actually used by routedLinks. Custom markers get an extra def each.
const usedColors = new Set<string>();
usedColors.add(props.defaultLinkColor);
for (const routed of routedLinks.value) {
  if (routed.color !== undefined) usedColors.add(routed.color);
}

const builtinMarkers = [
  'arrow',
  'diamond',
  'diamond-hollow',
  'circle',
  'circle-hollow',
  'pointer',
  'plus',
] as const;
const customMarkers = new Map<string, CustomLinkMarker>();
for (const link of props.links) {
  if (typeof link.marker === 'object') {
    customMarkers.set(link.marker.id, link.marker);
  }
}

// Build <defs> by iterating usedColors × (builtinMarkers + customMarkers).
// Marker id format: `cx-marker-${type}-${colorId}` where colorId
// strips non-alphanumeric from the color (matches k-ui's encoding).

// Build link <path>s by mapping routedLinks.
// Each <path> gets:
//   d={routed.pathD}
//   stroke={routed.color ?? props.defaultLinkColor}
//   stroke-width="1.5" fill="none"
//   marker-end="url(#cx-marker-${markerId}-${colorId})"
//   (omit marker-end when marker is 'none')

// Compose body SVG:
// <svg class="cx-gantt-body">
//   <defs>...</defs>
//   <g class="cx-gantt-bars">...</g>
//   <g class="cx-gantt-links" pointer-events="none">...</g>
// </svg>
```

Marker `<defs>` go in a NEW `<defs>` element at the top of the body
SVG (none today). The link `<g>` sits after the bars `<g>` so paint
order puts links above bars.

### Demo wiring

Extend `examples/gantt-vue3/src/sample-data.ts` with `sampleLinks:
readonly LinkSpec[]`. Six links covering the matrix below:

| Link              | from→to        | Routing | Marker         | colorOverride |
| ----------------- | -------------- | ------- | -------------- | ------------- |
| `link-1`          | bar-1 → bar-2  | square  | arrow          | —             |
| `link-2`          | bar-2 → bar-5  | square  | diamond        | —             |
| `link-3`          | bar-4 → bar-8  | smooth  | arrow          | —             |
| `link-4`          | bar-5 → bar-6  | smooth  | circle-hollow  | `#ef4444`     |
| `link-5`          | bar-6 → bar-7  | square  | plus           | —             |
| `link-6` (custom) | bar-3 → bar-11 | smooth  | custom (heart) | `#10b981`     |

This covers: square + smooth × same-row + cross-row × every
built-in marker that fits + colorOverride + custom marker.

App.vue exposes them via the `:links="sampleLinks"` prop. No new
toggles — Phase 8 ships with links always-on. (Later phases can
add a panel of dependency-line controls mirroring k-ui's
`lineStyle` / `markerType` selectors, but that's UX scope, not
rendering scope.)

## Test coverage

Add a `link-rendering.test.ts` SFC test file at
`adapters/vue3/src/`. Use the same `mount` pattern as
`chronix-gantt.test.ts`. ~14 cases:

1. **`links` prop default `[]` → no `<path class="cx-gantt-link">`**
   in the body SVG.
2. **Single square link with two placed bars → exactly 1 `<path>`,
   `d` equals the routing layer's output.**
3. **Single smooth (cross-row) link → 1 `<path>` whose `d` starts
   with `M ... C`.**
4. **Orphan link (toBarId references a missing bar) → no `<path>`,
   no crash, `link-orphan` event emitted once with the link id,
   `console.warn` called once.**
5. **Marker `<defs>` contains 7 built-in marker definitions for the
   default color** (id format `cx-marker-arrow-3788d8`, etc.).
6. **Custom marker → one extra `<marker>` def per `colorId` × the
   custom id**, paths from `CustomLinkMarker.paths` rendered inside.
7. **`marker-end` attribute on each `<path>` references the correct
   marker id** (`url(#cx-marker-arrow-3788d8)`).
8. **`marker: 'none'` link → `<path>` has no `marker-end` attr**.
9. **`colorOverride` on a link → `<path>` `stroke` and `marker-end`
   both use that color**; the corresponding marker def exists.
10. **No `colorOverride` → `<path>` `stroke` uses `defaultLinkColor`
    prop**; default of `#3788d8` when prop omitted.
11. **`pointer-events: none` on the `cx-gantt-links` group**.
12. **Links group renders AFTER bars group in DOM order** (querySelectorAll
    sequence: `.cx-gantt-bars` comes before `.cx-gantt-links`).
13. **Built-in `arrow` marker polygon `points="0 0, 4.5 2.25, 0 4.5"`**
    (verbatim parity with k-ui).
14. **Built-in `diamond-hollow` marker has `fill="white"` + `stroke`
    = color** (negative-fill parity assertion).

Existing 110 vue3 SFC tests stay; +14 brings total to **124 vue3
SFC tests**. Combined with core's 183, **chronix total becomes
307/307**.

## VRT impact

Sample data now includes 6 links → every existing chronix VRT
baseline (`chronix-view-day.png` … `chronix-view-year.png`) gains
visible paths in the body. **Rebaseline all 5** as part of Commit 3.

No NEW baselines for v0. Justification: the same 6 links render
across all 6 views (day / week / month / season / halfYear / year),
so the 5 existing view-toggles already cover the rendering surface.
A future phase can add baselines for "smooth toggle off" / "marker
selector" if `<ChronixGantt>` gains those controls.

## Execution plan — 3 commits

### Commit 1: links prop + path rendering (square only first, smooth via existing layout)

- Add `links` + `defaultLinkColor` props on `<ChronixGantt>`.
- Wire `defaultLinkRouter.route(...)` into `setup()`.
- Render `<path>` elements in a new `<g class="cx-gantt-links"
pointer-events="none">` after the bars group. Stroke from
  `routed.color ?? props.defaultLinkColor`, stroke-width 1.5,
  fill none. NO `marker-end` yet — bare paths, no arrowheads.
- Add `link-orphan` emit + `console.warn` for unresolved links.
- 5 SFC tests covering: default `[]` → no path; square link →
  1 path with correct `d`; smooth link → correct `d`; orphan →
  no crash + emit; pointer-events on group.
- Browser verify: chronix demo @ 8702 — drag a sample link's
  source bar and confirm path repositions on commit; switch
  views and confirm links re-derive.

### Commit 2: marker `<defs>` + `marker-end` wiring + colorOverride

- Add `<defs>` block at top of body SVG.
- Generate one `<marker>` per (markerType × color) pair from
  `usedColors`; iterate 7 built-in types + any custom markers in
  `props.links`. Marker geometry ports verbatim from k-ui's
  `renderMarker` (catalog item 10).
- Each `<path>` gets `marker-end="url(#cx-marker-${type}-${colorId})"`
  (omitted when `marker: 'none'`).
- 9 SFC tests covering: 7 built-in marker defs present, custom
  marker def present, marker-end attr correct, marker 'none' →
  no attr, colorOverride → stroke+marker color, default color
  fallback, arrow polygon parity, diamond-hollow fill+stroke
  parity, defs dedupe across N links of same color.
- Browser verify both demos side-by-side: marker shapes line up
  visually; colorOverride takes effect.

### Commit 3: demo sample links + VRT rebaseline

- Add `sampleLinks: readonly LinkSpec[]` to sample-data.ts (6
  entries per the matrix above, including 1 custom marker — a
  heart shape so the custom path is visually distinct).
- Wire `:links="sampleLinks"` on `<ChronixGantt>` in App.vue.
- Run `pnpm --filter @chronixjs/golden-runner chronix-capture` to
  rebaseline the 5 existing VRTs.
- Browser verify both demos visually agree on link rendering for
  at least 3 views (day, month, year).

### Commit 4 (wrap-up, not part of feature impl): journal + docs

- `audit/journal/2026-05-13.md` adds a `## Phase 8 — Link
rendering in <ChronixGantt>` section with: read files,
  decisions made, deviations from k-ui (the catalog's ⏸️ / ❌
  entries), test counts.
- This design doc's "Status" header → `**DONE (date)**` with the
  commit shas linked.
- Memory `project_gantt_rewrite_plan.md` updated: total test count
  293 → 307, Phase 8 added to the phase list with status DONE.
- Any cross-references in earlier phase docs (Phase 7 mentions
  "link rendering in `<ChronixGantt>` adapter still parked") get
  updated to point at this doc.

## Estimated scope

- Catalog + design doc: ~2 hours (this commit, separate)
- Commit 1 (paths, no markers): ~2 hours
- Commit 2 (markers + defs): ~3 hours
- Commit 3 (demo + VRT): ~1 hour
- Commit 4 (docs): ~30 min
- Browser smoke tests interleaved: ~30 min total
- **Total: ~9 hours focused work** spread across 1–2 sessions.

## Open questions for the user

1. **Approve forward-only link rendering for v0?** Backward links
   (target's x < source's x) stay parked at the routing layer for
   square + smooth — `<ChronixGantt>` simply renders whatever the
   router emits, so backward links would fail at the router with
   the existing "not yet implemented" throw. No additional `<ChronixGantt>`
   logic needed.

2. **Approve the `<defs>+marker-end` strategy over inline marker
   shapes?** Recommended because it matches k-ui exactly and
   leverages SVG's native marker infrastructure. `RoutedLinkMarker`
   stays on the routing output as documentation / off-DOM hook.

3. **Approve dropping the per-direction marker variants** (k-ui
   has `vertical-up` / `vertical-down` variants for clipped
   targets)? chronix v0 only emits horizontal-forward paths so all
   markers point right; per-direction variants land alongside the
   parked clipped-edge routing in a future phase.

4. **Approve the `defaultLinkColor` prop default of `#3788d8`** to
   match k-ui's `dependencyLineColor` default exactly? An
   alternative would be a Tailwind-friendly slate / blue tone, but
   matching k-ui keeps the parity story honest at the demo level.

5. **Approve the 6 sample links in the demo** including a custom
   heart-shaped marker on `link-6`? The heart proves the
   `CustomLinkMarker` codepath at the render layer in addition to
   at the IR layer. Alternative: 5 built-in markers only and defer
   the custom-marker demo wiring to a later phase (custom-marker
   SFC tests would still run).

6. **Confirm `link-orphan` is fire-and-forget** (emit + console.warn,
   no `Promise` / no abort signal)? An alternative is to validate
   links once in setup and throw if any are orphaned, but that
   would crash an app whose data is mid-load. The fire-and-forget
   pattern matches how chronix handles `BarPlacementPass`'s
   `orphanBarIds` today.

7. **Confirm we don't add the `useLineEventColor` toggle in v0**?
   Chronix `BarSpec` has no bar-color field yet — the prop would
   resolve to an undefined source color on every bar. The toggle
   joins when chronix grows bar coloring (which is a separate
   parity gap not yet planned).

Reply **"按照推荐继续"** to accept all defaults (catalog
dispositions, 3-commit plan, 6 sample links + heart custom marker,
14 new SFC tests, rebaseline 5 VRTs no new ones).

## Appendix — Marker SVG fragments (chronix flavor)

Direct ports of k-ui's `renderMarker` (TimelineDependencies.tsx
lines 519–663). Each marker uses `markerUnits="strokeWidth"`,
`overflow="visible"`, `markerWidth="4.5"`, `markerHeight="4.5"`.
Horizontal direction only (chronix v0 has no vertical variants).

```html
<!-- arrow -->
<marker id="cx-marker-arrow-{colorId}" refX="4" refY="2.25" orient="auto">
  <polygon points="0 0, 4.5 2.25, 0 4.5" fill="{color}" />
</marker>

<!-- diamond -->
<marker id="cx-marker-diamond-{colorId}" refX="4.5" refY="2.5" orient="auto">
  <polygon points="0 2.5, 2.5 0, 5 2.5, 2.5 5" fill="{color}" />
</marker>

<!-- diamond-hollow -->
<marker id="cx-marker-diamond-hollow-{colorId}" refX="4.5" refY="2.5" orient="auto">
  <polygon points="0 2.5, 2.5 0, 5 2.5, 2.5 5" fill="white" stroke="{color}" stroke-width="1.0" />
</marker>

<!-- circle -->
<marker id="cx-marker-circle-{colorId}" refX="5" refY="3">
  <circle cx="3" cy="3" r="2.0" fill="{color}" />
</marker>

<!-- circle-hollow -->
<marker id="cx-marker-circle-hollow-{colorId}" refX="5.75" refY="3">
  <circle cx="3" cy="3" r="2.0" fill="white" stroke="{color}" stroke-width="1.5" />
</marker>

<!-- pointer -->
<marker id="cx-marker-pointer-{colorId}" refX="5" refY="2.5" orient="auto">
  <polygon points="0 0, 6 2.5, 0 5, 1.5 2.5" fill="{color}" />
</marker>

<!-- plus -->
<marker id="cx-marker-plus-{colorId}" refX="4" refY="2.5" orient="auto">
  <path
    d="M 2.5 0.5 L 2.5 2 L 4 2 L 4 3 L 2.5 3 L 2.5 4.5 L 1.5 4.5 L 1.5 3 L 0 3 L 0 2 L 1.5 2 L 1.5 0.5 Z"
    fill="{color}"
  />
</marker>

<!-- none → no <marker> emitted; <path> omits marker-end -->
```

`{colorId}` strips non-alphanumeric from the color string:
`'#3788d8'.replace(/[^a-zA-Z0-9]/g, '')` → `'3788d8'`. Matches
k-ui's encoding.
