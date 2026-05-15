# Phase 14 — Resizable sidebar (single area divider)

**Status**: **Approved (pending user reply)** — design only; no code yet.

## Problem

Phase 5 (sidebar) ships fixed-width columns: each `ColumnSpec.width` is
a number in props and the sidebar's total width = sum of those numbers.
The consumer can change the props to re-render at a new width, but
during a session the user can't grab the boundary between sidebar and
chart and drag it. K-ui has this affordance (`gantt-timeline-divider`
between the resource area and the timeline area), so chronix should
have it too.

Scope is deliberately narrow: a **single area divider** between
sidebar and chart, exactly mirroring k-ui's design. NOT per-column
dividers — k-ui doesn't have those, so chronix won't either.

## Reference (k-ui) behavior surface — full catalog

Walked `packages/gantt/src/resource-timeline/ResourceTimelineLayout.tsx:5,
26, 61, 65, 74, 126-138, 199-204, 304-342` and grepped for `col-resize`
/ `columnDivider` / `column.?resize` across the entire k-ui source.
Findings:

1. **`gantt-timeline-divider`** (`ResourceTimelineLayout.tsx:127-138`)
   — one `<div>` between the resource panel and the timeline area.
   `cursor: 'col-resize'`. Lives in grid column 2 of a 3-column grid
   (`'1 / 3'` row span so it spans header + body rows). Sticky when
   `stickyHeader: true`.
2. **`MIN_RESOURCE_AREA_WIDTH = 30`** (`ResourceTimelineLayout.tsx:5`)
   — minimum sidebar width in px. Drag clamps at `[30, viewWidth - 30]`.
3. **`resourceAreaWidthOverride: number | null`** state
   (`ResourceTimelineLayout.tsx:26, 65`) — `null` means "use the
   `resourceAreaWidth` prop"; once the user drags, gets a px number.
4. **`initResizing()`** (`ResourceTimelineLayout.tsx:305-335`) — wires
   `ElementDraggingImpl` to the divider; on `dragstart` captures
   `dragStartWidth` from `headerLeftRef.getBoundingClientRect().width`
   and `viewWidth` from `rootElRef`; on `dragmove` computes
   `newWidth = dragStartWidth + pev.deltaX * (isRtl ? -1 : 1)` and
   clamps. `setAutoScrollEnabled(false)` — divider drag doesn't scroll
   the chart.
5. **No emit / callback** when resize commits. K-ui keeps the override
   in component state and discards it when the component unmounts (or
   when the consumer manually rewrites `resourceAreaWidth`).
6. **No per-column resize anywhere**. Columns inside the resource area
   get widths from `resourceTableLayout.ts:120-153` (`computeAutoCol
Widths`) which distributes the area's total width across columns
   based on label content estimation. The user resizes the AREA, not
   individual columns.
7. **RTL support** via `isRtl` sign flip (`pev.deltaX * -1`) — k-ui
   supports right-to-left layouts.
8. **Sticky positioning** for the divider when `stickyHeader: true` so
   the divider stays visible across vertical scroll.

### Catalog with chronix v0 dispositions

| Item                                                  | k-ui                                             | Chronix v0                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Single area divider (sidebar ↔ chart)                 | ✅                                               | ✅ port                                                                                                        |
| `col-resize` cursor on divider                        | ✅                                               | ✅ port                                                                                                        |
| MIN constraint (k-ui: 30px)                           | ✅                                               | ✅ port — chronix `MIN_SIDEBAR_AREA_WIDTH = 40` (slightly larger since chronix bakes ~16px of cell padding in) |
| MAX = `viewWidth − MIN` constraint                    | ✅                                               | ✅ port                                                                                                        |
| Internal `sidebarWidthOverride` state, null initially | ✅                                               | ✅ port                                                                                                        |
| Reactive prop change keeps existing override          | ✅                                               | ✅ port (override sticks until explicitly cleared)                                                             |
| Sticky-header divider                                 | ✅                                               | ✅ port — chronix's sidebar is already sticky-left per Phase 5; divider rides the same sticky plane            |
| Per-column resize                                     | ❌                                               | ⏸️ parked                                                                                                      |
| RTL support (`isRtl` sign flip)                       | ✅                                               | ⏸️ parked — chronix never wired RTL through any other interaction; adding RTL just here would drift            |
| Resize emit / callback                                | ❌                                               | ⏸️ parked — wait for consumer demand                                                                           |
| Persisted override (localStorage etc.)                | ❌                                               | ⏸️ parked — consumer concern                                                                                   |
| Touch support (`Pointer` events for finger drag)      | partial (k-ui's PointerDragEvent abstracts both) | ✅ port — chronix already uses Pointer Events for bar drag; divider uses the same API                          |
| `dblclick` to reset override                          | ❌                                               | ⏸️ parked                                                                                                      |

### What the divider needs to know that k-ui's doesn't

K-ui's columns share width via `resourceTableLayout.ts`'s
auto-distribution — when the area resizes, columns naturally re-flow
because they're laid out by table-layout: fixed with computed widths.

Chronix's columns are explicit `ColumnSpec.width` props. When the
area resizes:

- **Option A (recommended)**: Proportional scaling. Effective column
  widths become `colSpec_i.width × (overrideWidth / sumOfPropWidths)`.
  Cell borders stay aligned (single proportional scale factor). Per-
  column ratios preserved across drag.
- **Option B**: Resize affects only the LAST column. Other columns
  keep their prop widths. Simpler but feels wrong — user thinks they're
  resizing the area, not "the rightmost column".
- **Option C**: Resize distributes the delta equally among all columns.
  Behaves oddly when columns have very different widths (a 200px
  column and a 60px column both grow by the same delta, which makes
  the narrow one disproportionately bigger).

Recommended: **A**. Matches user mental model ("I'm dragging the area
boundary, the columns inside scale with it"). Single multiplier in the
render path; no per-column state.

## Approach

### Adapter API after Phase 14

`<ChronixGantt>` gains:

```ts
// No new prop strictly required for v0 — the existing
// ColumnSpec.width acts as the INITIAL width. The override lives in
// internal state and resets when the component unmounts (k-ui parity).
// If a consumer wants to control / persist the override, this can be
// promoted to a `sidebarWidthOverride?: number | null` prop + a
// `'sidebar-resize'` emit in a follow-up phase (parked above).
```

No new props. No new emits. The whole change is internal state +
divider DOM + one pointer handler.

### Internal state

```ts
// adapters/vue3/src/chronix-gantt.ts setup()
const sidebarWidthOverride = ref<number | null>(null);

const effectiveSidebarWidth = computed<number>(() => {
  const cols = props.columns;
  if (cols.length === 0) return 0;
  const baseSum = cols.reduce((sum, c) => sum + c.width, 0);
  return sidebarWidthOverride.value ?? baseSum;
});

const sidebarScale = computed<number>(() => {
  const cols = props.columns;
  if (cols.length === 0) return 1;
  const baseSum = cols.reduce((sum, c) => sum + c.width, 0);
  if (baseSum === 0) return 1;
  return effectiveSidebarWidth.value / baseSum;
});
```

The render path's existing `sidebarWidth = cols.reduce(...)` becomes
`sidebarWidth = effectiveSidebarWidth.value`. The `<colgroup>` /
`<col>` widths become `${c.width * sidebarScale.value}px`. The grid
template column becomes `${effectiveSidebarWidth.value}px auto` (no
change to the line — just the source value).

### Divider DOM

The wrapper currently has 2 (no sidebar) or 4 (with sidebar) children.
Phase 14 inserts a 5th child between `sidebarHeader / sidebarBody` and
`headerSvg / bodySvg`, BUT keeps the wrapper as a 2-column grid (the
divider can be `position: absolute` over the right edge of the sidebar,
so it doesn't disturb the grid track layout). The simpler alternative
is to make the wrapper a 3-column grid (`sidebar | divider | chart`),
but that changes the grid arithmetic Phase 5.x baked in (auto track,
sticky positioning, etc.).

**Recommended approach: absolute-positioned divider.** The divider is
a separate sticky-left element that overlays the boundary at
`left: ${effectiveSidebarWidth - dividerWidth / 2}px`. It's a thin
hit zone (e.g. 8px wide) centered on the boundary so the user can
grab it without pixel precision. Visually it's a 1px line + a wider
invisible hit zone.

```ts
const DIVIDER_HIT_WIDTH = 8; // pixel width of the grab zone
const DIVIDER_VISIBLE_WIDTH = 1; // visible line width
const MIN_SIDEBAR_AREA_WIDTH = 40;

const divider = h('div', {
  ref: dividerRef,
  class: 'cx-gantt-sidebar-divider',
  style: {
    position: 'sticky',
    left: `${effectiveSidebarWidth.value - DIVIDER_HIT_WIDTH / 2}px`,
    top: 0,
    width: `${DIVIDER_HIT_WIDTH}px`,
    height: '100%',
    cursor: 'col-resize',
    // Visible line via inner pseudo-element OR a child <div>
    zIndex: 4,
    userSelect: 'none',
    touchAction: 'none',
  },
  onPointerdown: onDividerPointerdown,
});
```

Hmm — `position: sticky; left: <px>` with a 2-column CSS grid wrapper
gets fiddly because sticky tracks the scrollport, not the grid track.
Safer: switch to a **3-column grid** `${sidebarWidth}px ${dividerW}px
auto` where the middle column is the divider track. The divider
becomes a normal grid child + sticky-left like sidebar-body. Less
clever, more robust.

Updated plan: **3-column grid** when sidebar is present.

```ts
const wrapperStyle: Record<string, string> = hasSidebar
  ? {
      overflow: 'auto',
      display: 'grid',
      gridTemplateColumns: `${effectiveSidebarWidth.value}px ${DIVIDER_HIT_WIDTH}px auto`,
    }
  : { overflow: 'auto' };
```

Wrapper children when sidebar present become:
`[sidebarHeader, divider, headerSvg, sidebarBody, dividerBody?, bodySvg]`
— but a grid can't span `1 / 3` without `gridRow / gridColumn` overrides.
Cleaner: render the divider ONCE as a span-both-rows element with
`gridColumn: '2'; gridRow: '1 / 3'`. Wrapper children:
`[sidebarHeader, headerSvg, sidebarBody, bodySvg, divider]` — divider
last so it paints on top, with explicit `gridColumn: '2'; gridRow:
'1 / 3'` to span both rows in column 2. All other panes get explicit
`gridColumn` assignments too.

```ts
// Each pane gets explicit grid placement so the divider can span.
sidebarHeader.style.gridColumn = '1';
sidebarHeader.style.gridRow = '1';
headerSvg.style.gridColumn = '3';
headerSvg.style.gridRow = '1';
sidebarBody.style.gridColumn = '1';
sidebarBody.style.gridRow = '2';
bodySvg.style.gridColumn = '3';
bodySvg.style.gridRow = '2';
divider.style.gridColumn = '2';
divider.style.gridRow = '1 / 3';
```

(Existing Phase 5/5.x styles don't set `gridColumn` explicitly — they
rely on insertion order. Phase 14 makes the placement explicit which
is robust against future child reorderings.)

### Drag handler

Match `useGanttPointer`'s pointer lifecycle but standalone — the
divider doesn't share state with bar drag / resize (different
transaction kind, different commit semantics). Keep it inline in the
adapter setup() to avoid growing the pointer composable for this one
case.

```ts
const dividerDragStartWidth = ref<number | null>(null);
const dividerDragStartClientX = ref<number | null>(null);

function onDividerPointerdown(e: PointerEvent): void {
  if (e.button !== 0) return;
  dividerDragStartWidth.value = effectiveSidebarWidth.value;
  dividerDragStartClientX.value = e.clientX;
  dividerRef.value?.setPointerCapture?.(e.pointerId);
  e.preventDefault(); // prevent text selection during drag
}

function onDividerPointermove(e: PointerEvent): void {
  if (dividerDragStartWidth.value === null) return;
  if (dividerDragStartClientX.value === null) return;
  const wrapperWidth = wrapperRef.value?.getBoundingClientRect().width ?? 0;
  const maxWidth = Math.max(MIN_SIDEBAR_AREA_WIDTH, wrapperWidth - MIN_SIDEBAR_AREA_WIDTH);
  const proposed = dividerDragStartWidth.value + (e.clientX - dividerDragStartClientX.value);
  sidebarWidthOverride.value = Math.max(MIN_SIDEBAR_AREA_WIDTH, Math.min(maxWidth, proposed));
}

function onDividerPointerup(e: PointerEvent): void {
  if (dividerDragStartWidth.value === null) return;
  dividerDragStartWidth.value = null;
  dividerDragStartClientX.value = null;
  dividerRef.value?.releasePointerCapture?.(e.pointerId);
}

function onDividerPointercancel(e: PointerEvent): void {
  // Browser-initiated cancel — revert? Or keep current override?
  // K-ui keeps it. Match.
  dividerDragStartWidth.value = null;
  dividerDragStartClientX.value = null;
  dividerRef.value?.releasePointerCapture?.(e.pointerId);
}
```

Handlers attach to the divider DOM element. The body SVG's existing
pointer handlers are NOT touched — divider drag and bar drag are
spatially disjoint (divider has its own hit zone above z-index 4).

### Wrapper ref

Need a `wrapperRef = ref<HTMLDivElement | null>(null)` to read
`getBoundingClientRect().width` for the MAX clamp. Currently the
wrapper is just an `h('div', ...)` without a ref. Add the ref.

### CSS

```css
/* examples/gantt-vue3/src/styles.css */
.cx-gantt-sidebar-divider {
  background: transparent;
  position: relative;
}

.cx-gantt-sidebar-divider::after {
  /* The visible 1px line. Centered in the 8px hit zone. */
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 1px;
  height: 100%;
  background: #d1d5db;
}

.cx-gantt-sidebar-divider:hover::after {
  background: #9ca3af;
  width: 2px;
}
```

Light hover state so the affordance is discoverable. No active-drag
state in v0 (cursor: col-resize already signals it).

## Test coverage — adapter SFC only (+6)

Pure SFC tests; no core helper to test (the entire change is adapter-
local). Pattern matches Phase 11/12 SFC test files.

1. **Divider renders when `columns` is non-empty**;
   `cx-gantt-sidebar-divider` class present, `cursor: col-resize`.
2. **No divider when `columns` is empty / omitted**; element not in
   DOM (the no-sidebar branch is unchanged).
3. **`pointerdown` on divider → `pointermove` → grid template column
   reflects new sidebar width**. happy-dom returns 0 for
   `getBoundingClientRect()` unless we stub it; use a `vi.spyOn` on
   the wrapper ref's `getBoundingClientRect` to return a known
   wrapperWidth (e.g. 1000).
4. **MIN clamp**: drag past `MIN_SIDEBAR_AREA_WIDTH` (40px) on the
   left edge → sidebar width stays at 40.
5. **MAX clamp**: drag past `wrapperWidth − MIN` → sidebar width caps
   at `wrapperWidth − 40`.
6. **Column cells scale proportionally during drag**. After dragging
   the sidebar from baseSum=240 to override=120 (50%), each `<col>`'s
   width attribute reads half its `ColumnSpec.width`. Verifies the
   `sidebarScale` multiplier reaches the colgroup.

(Test 7 could be "pointerdown without pointermove does not change
width" — included if happy-dom event simulation makes it cheap.
Skipped from the +6 count for now.)

**Total new tests: 6.** core 199 unchanged. vue3 158 → 164.
Chronix total **358 → 364**.

## VRT impact

**One baseline likely needs a small update.** The default baseline
captures the demo with sidebar at its initial width (sum of
ColumnSpec.width). Phase 14 adds a 8-px-wide divider track in the
grid template, so the chart starts 8px further right than before.
That's a real geometric change.

Mitigations considered:

- Make the divider 0-width by default and grow on hover? Breaks the
  "discoverable hit zone" premise.
- Render the divider only when `editable` / `selectable`? Coupling
  unrelated features; the divider is a sidebar feature, not an
  interaction-mode feature.
- Render the divider with `width: 0` and use a `::before` overflow to
  paint? Hit testing on a 0-width element is unreliable.

**Decision: accept the 8px shift; rebaseline the 5 VRT screenshots.**
Phase 8 / Phase 12 each rebaselined when geometry changed; same
pattern.

If we want to avoid the rebaseline cost: set `DIVIDER_HIT_WIDTH = 0`
when `columns` is empty (already short-circuits the divider, so no
shift). When columns present, the 8px is real. Test if it actually
diffs the 5 baselines or only the ones that include the sidebar.

## Execution plan — 2 commits + wrap-up

### Commit 1: divider + state + 6 SFC tests + demo style

- `chronix-gantt.ts`:
  - Add `const MIN_SIDEBAR_AREA_WIDTH = 40` / `DIVIDER_HIT_WIDTH = 8`
    at module top.
  - `setup()`: add `sidebarWidthOverride: Ref<number | null>`,
    `effectiveSidebarWidth: ComputedRef<number>`, `sidebarScale:
ComputedRef<number>`, `wrapperRef`, `dividerRef`, and four
    pointer handlers (`onDividerPointerdown` / `move` / `up` / `cancel`).
  - Render fn: replace `sidebarWidth` references with
    `effectiveSidebarWidth.value`. Multiply each `<col>`'s width by
    `sidebarScale.value`. Update wrapper `gridTemplateColumns` to
    3-column layout. Add explicit `gridColumn` / `gridRow` to each
    pane. Insert the divider as a final wrapper child with explicit
    grid placement. Add `ref: wrapperRef`.
- `examples/gantt-vue3/src/styles.css`: add the divider CSS rules.
- `adapters/vue3/src/chronix-gantt.test.ts`: 6 new tests in a
  dedicated `describe('sidebar resize divider', ...)` block.
- Browser-verify at chronix demo 8702: hover the boundary →
  cursor: col-resize, line darkens. Drag left/right → sidebar resizes
  smoothly. Try to drag past MIN / MAX → clamps. Refresh → resets to
  prop widths (no persistence, by design).
- Rebaseline the 5 chronix VRT baselines (Phase 8 / Phase 12 pattern).
- ci-check green → commit.

### Commit 2 (optional, skip if Commit 1 is clean): VRT rebaseline only

- If the VRT diff is mechanical (clean 8px shift on the sidebar-
  containing baselines), one commit with `pnpm test:vrt --update-
snapshots`. Otherwise fold into Commit 1.

### Commit 3 (= wrap-up): journal + status DONE + memory update

- `audit/journal/2026-05-13.md` Phase 14 section.
- This doc's Status → DONE with commit shas + final test counts.
- Memory `project_gantt_rewrite_plan.md` updated: test count
  358 → 364; Phase 13 skipped (linked); Phase 14 added.

## Estimated scope

- Design doc: this commit (~45 min).
- Commit 1 (divider + state + 6 tests + demo CSS): ~2.5 hours.
- VRT rebaseline: ~30 min (Phase 8 pattern).
- Commit 3 (wrap-up): ~30 min.
- Browser verify: ~15 min.
- **Total: ~4.5 hours focused work.** Smaller than Phase 12/13 because
  no composable, no core helper, no new emits / props.

## Open questions for the user

1. **Approve proportional column scaling (Option A) over
   "last-column-absorbs-delta" (Option B)?** Recommended A — single
   multiplier, preserves user-supplied column ratios, matches the
   "I'm dragging the area boundary" mental model.

2. **Approve internal-only state (no `sidebarWidthOverride` prop, no
   `'sidebar-resize'` emit)?** Matches k-ui exactly. Consumers who
   need to persist or control the width can ask in a follow-up phase.

3. **Approve 40px MIN (vs k-ui's 30px)?** Chronix's cells have ~16px
   horizontal padding baked in; at 30px the cells render empty.
   40 leaves room for one character. Adjustable; 30 also works if
   you prefer strict parity.

4. **Approve 8px divider hit zone with 1px visible line + hover state?**
   Standard window-system divider sizing. Could go thinner (4px) or
   wider (12px) — 8 is a middle-of-the-road choice.

5. **Approve 3-column grid (`sidebar | divider | chart`) over a 2-column
   grid with absolute-positioned divider?** Recommended 3-column —
   sticky-left positioning on the divider is more natural with an
   explicit track, and the divider rides the existing sidebar-sticky
   plane without z-index gymnastics.

6. **Approve rebaselining 5 VRT screenshots** to absorb the 8px
   horizontal shift? Recommended yes — Phase 8 / Phase 12 each
   rebaselined for geometric changes; standard practice.

7. **Confirm scope excludes**: per-column dividers, RTL support,
   touch long-press, dblclick-to-reset, `sidebar-resize` emit,
   persisted override. All parked, all explicit in the catalog.

Reply **"按照推荐继续"** to accept all defaults (proportional scaling,
internal state only, 40px MIN, 8px hit zone + 1px line, 3-column grid,
VRT rebaseline, parked items stay parked).
