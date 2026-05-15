# Phase 13 — Keyboard navigation + delete-selected event

**Status**: **SKIPPED (2026-05-15)**. Closed without implementation after
user redirected: "k-ui 里没有的，chronix 也可以没有".

This file is retained as an audit record so the catalog of considered-
then-rejected work doesn't disappear from `audit/` (per the
`feedback_no_logic_drift_from_kui.md` discipline — explicit dispositions
beat silent gaps).

## Why skipped

The original Phase 13 plan (visible in git history at the commit that
introduced this file) proposed:

- Arrow keys (←/→/↑/↓) move selection across bars in a deterministic
  order (a `orderBarsForKeyboardNav` core helper + a
  `handleKeyboardNavigate` method on `useGanttSelection`).
- Shift+Arrow extends the selection (keyboard equivalent of shift-click).
- `Delete` / `Backspace` emit `'bar-delete-request'`.
- `Escape` clears selection.
- Body SVG becomes the single tab stop with `role="grid"` +
  `aria-activedescendant` (WAI-ARIA grid pattern).
- `keyboardEnabled` / `keyboardLabel` props + focus-ring CSS in demo.

All of this is **chronix-new** — k-ui ships none of it. The user's
position (correctly): chronix is an R2 rewrite of k-ui with L2 parity,
not a re-design. Inventing a keyboard nav layer that k-ui never had
violates that contract and grows surface that nobody asked for.

## Reference (k-ui) keyboard surface — full catalog

Walked `packages/gantt/src/util/dom-event.ts:89-109`,
`packages/gantt/src/component/event-rendering.ts:440-465`,
`packages/gantt/src/timeline/TimelineEvent.tsx:350-374`. Grepped
`packages/gantt/src/interactions/` + `packages/gantt/src/interaction/`
for `keydown` / `Arrow*` / `Delete` / `tabIndex` / `aria-selected` /
`aria-activedescendant` / `role="grid"`, and
`examples/gantt/vue3/src/DemoApp.vue` for the same. Findings:

1. **`createAriaKeyboardAttrs(handler)`** (`util/dom-event.ts:99-108`)
   adds `tabIndex: 0` + `onKeyDown` that fires the same handler on
   `Enter` / `Space` (with `preventDefault` on space). Used by
   `event-rendering.ts:454` so each event seg is keyboard-activatable
   (Enter/Space → `eventClick`).
2. **`TimelineEvent.tsx:356`** hardcodes `tabIndex={0}` on the seg's
   root `<g>`. Each bar is individually tab-focusable.
3. **No other keyboard handling anywhere in the package**. No arrow
   keys, no `Delete`, no `Backspace`, no `Escape`, no `Home` / `End`,
   no focus-trap, no `aria-selected`, no `aria-activedescendant`, no
   `role="grid" / "row" / "gridcell"`. (`Popover.tsx` has a `keydown`
   for Esc-to-dismiss, but that's a popover concern.)
4. **Demo has no keyboard handlers.** `DemoApp.vue` has no `tabindex`
   / `keydown` / `Arrow*` / `Delete` references.

Translation: k-ui's "keyboard affordance" is one tab-stop per bar +
Enter/Space-as-click. Nothing else.

## Disposition table

Every item the original Phase 13 plan considered, with its parity-
respecting disposition:

| Item                                                | k-ui has? | Chronix v0 |
| --------------------------------------------------- | --------- | ---------- |
| Per-bar `tabIndex={0}` (one tab stop per bar)       | ✅        | ⏸️ parked  |
| Enter / Space on focused bar → fire bar-click       | ✅        | ⏸️ parked  |
| Arrow-key navigation                                | ❌        | ⏸️ parked  |
| Shift+Arrow selection extension                     | ❌        | ⏸️ parked  |
| Home / End / PageUp / PageDown                      | ❌        | ⏸️ parked  |
| Delete / Backspace → `'bar-delete-request'` emit    | ❌        | ⏸️ parked  |
| Escape → clear selection                            | ❌        | ⏸️ parked  |
| `role="grid"` + `aria-activedescendant` on body SVG | ❌        | ⏸️ parked  |
| `aria-selected="true"` on selected bars             | ❌        | ⏸️ parked  |
| `keyboardEnabled` / `keyboardLabel` props           | ❌        | ⏸️ parked  |
| `orderBarsForKeyboardNav` core helper               | ❌        | ⏸️ parked  |
| Focus-ring CSS in demo                              | ❌        | ⏸️ parked  |
| `selection-change` adapter emit (Phase 12 parked)   | ❌        | ⏸️ parked  |

**Every item is `⏸️ parked`, not `❌ rejected`.** Future phases can
revisit any of them with explicit consumer demand. The minimal "✅
port" item (per-bar tabindex + Enter/Space → bar-click) is a small
follow-up; can land as a throwaway commit in a later phase if a
consumer asks, or stay parked indefinitely.

## What replaced this phase

Skipped to Phase 14 (resizable sidebar — single area divider between
resource panel and chart, matching k-ui's `gantt-timeline-divider`).
See `audit/PHASE_14_RESIZABLE_SIDEBAR_DESIGN.md`.
