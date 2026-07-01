# Chronix

A component library monorepo. Published under the npm scope [`@chronixjs`](https://www.npmjs.com/org/chronixjs).

Source: [github.com/liaoyu1992/chronixjs](https://github.com/liaoyu1992/chronixjs)

> **Status: alpha.** Published under the `alpha` npm dist-tag. Install with `@alpha`. APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Packages

### Core (framework-agnostic)

| Package                                  | Description                                                            | Install                            |
| ---------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| [`@chronixjs/gantt`](./packages/gantt)   | Gantt core — types + pure helpers + IR                                 | `pnpm add @chronixjs/gantt@alpha`  |
| [`@chronixjs/table`](./packages/table)   | Table core — types + pure helpers + IR                                 | `pnpm add @chronixjs/table@alpha`  |
| [`@chronixjs/ui`](./packages/ui)         | UI component IR — 85 components, theme tokens, popup, tree, form       | `pnpm add @chronixjs/ui@alpha`     |
| [`@chronixjs/cx-kit`](./packages/cx-kit) | Headless primitives (virtual list, slider, color picker, autocomplete) | `pnpm add @chronixjs/cx-kit@alpha` |

### Adapters (per-framework)

| Package                                            | Framework     | Install                                                 |
| -------------------------------------------------- | ------------- | ------------------------------------------------------- |
| [`@chronixjs/gantt-vue3`](./adapters/gantt-vue3)   | Vue 3         | `pnpm add @chronixjs/gantt-vue3@alpha vue`              |
| [`@chronixjs/gantt-vue2`](./adapters/gantt-vue2)   | Vue 2.7       | `pnpm add @chronixjs/gantt-vue2@alpha vue@^2.7`         |
| [`@chronixjs/gantt-react`](./adapters/gantt-react) | React 18 / 19 | `pnpm add @chronixjs/gantt-react@alpha react react-dom` |
| [`@chronixjs/table-vue3`](./adapters/table-vue3)   | Vue 3         | `pnpm add @chronixjs/table-vue3@alpha vue`              |
| [`@chronixjs/table-vue2`](./adapters/table-vue2)   | Vue 2.7       | `pnpm add @chronixjs/table-vue2@alpha vue@^2.7`         |
| [`@chronixjs/table-react`](./adapters/table-react) | React 18 / 19 | `pnpm add @chronixjs/table-react@alpha react react-dom` |
| [`@chronixjs/ui-vue3`](./adapters/ui-vue3)         | Vue 3         | `pnpm add @chronixjs/ui-vue3@alpha vue`                 |
| [`@chronixjs/ui-vue2`](./adapters/ui-vue2)         | Vue 2.7       | `pnpm add @chronixjs/ui-vue2@alpha vue@^2.7`            |
| [`@chronixjs/ui-react`](./adapters/ui-react)       | React 18 / 19 | `pnpm add @chronixjs/ui-react@alpha react react-dom`    |

Each adapter re-exports the runtime component layer and depends on its core package transitively. Install the core package directly only when consuming types / IR / pure helpers in non-framework code.

## Features (gantt)

- 6 timeline views: day / week / month / season (3-month) / halfYear / year
- Bar drag, edge resize, progress drag, cross-row drag, range-select-to-create, click-to-select
- Dependency lines: square + smooth Bézier routing, 7 built-in markers + custom marker shape, per-link color override, source-bar color cascade
- Today line + today-cell background + axis grid lines + event continuation triangles
- Viewport-clipped triangle apex relocation + viewport-aware bar text + progress-dot positioning
- Theme prop (50 tokens) for colors / typography / borders
- Slot registry for full bar / link / header-cell render replacement
- Imperative handle: `changeView` / `prev` / `next` / `today` / `gotoDate` / `incrementDate` / `zoomTo` / `scrollToDate` / `getBarById` / `getBars` / `getBarTable` / `getRowDataSource` / `getLinkTable` / `subscribe`
- Header toolbar with string DSL (`{ left, center, right }` or `{ start, center, end }`)
- Per-bar / per-link class-name + render callbacks
- Validators (`eventAllow` / `eventOverlap` / `eventConstraint` / `selectAllow`) with rejection callbacks
- Public helper API: text truncation, DPR-aware grid-line snap, viewport-clipping derivation, edge-padded x derivation

## Features (table)

- 7 pure layout passes: column / row / sort / filter / page / pinned-cols / pinned-rows / virtual-rows / tree-flatten
- 34 chronix-NEW pure helpers: clipboard, drag-fill, undo/redo, autosize, column reorder, keyboard nav, tree selection, header groups, footer aggregator, scroll-into-view, CSV export, saved views, and more
- Inline editing with type-driven coercion + Tab / Shift+Tab traversal
- Cell-range selection: drag, shift+click extend, copy/paste (TSV), drag-fill
- Undo / redo over mutation batches; Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z
- Tree data: synchronous + lazy-load; chevron / keyboard expand toggle; tristate selection
- Multi-row & nested column headers with zone-aware merge
- Pinned columns (left / right) + pinned rows (top / bottom) + cross-zone reorder guard
- Column resize / move / autosize
- Sticky footer + status bar
- Column visibility menu
- Cell-level keyboard navigation (arrow, Home/End, PageUp/Down, Ctrl combos, Shift+Arrow extend)
- Tooltips per column
- Loading + no-rows overlays
- CSV export (`rowSource: 'all' | 'visible' | 'filtered' | 'selected'`)
- Saved views: `getTableView` / `applyTableView`
- Cell-style editor (4 axes × per-side × HSV picker)
- Advanced filter typeahead (4-slot type-aware token detector)
- Validation: per-column sync/async + cross-cell row validators
- Multi-filter container with nested group-tree IR
- Theme prop (29 tokens)
- Imperative handle (58 methods)

## Features (ui)

- **85 components** across 5 tiers, each × 3 adapters (Vue 3 / Vue 2.7 / React 18 / 19)
- **Tier A** (40): Button, Tag, Badge, Typography, Avatar, Input, Checkbox, Switch, Radio, etc.
- **Tier B** (33): Modal, Drawer, Dropdown, Menu, Tabs, Carousel, Collapse, etc.
- **Tier C** (12): Tree, Select, DatePicker, TimePicker, Calendar, Form, Upload, etc.
- **Tier D** (5): Message, Notification, DiscreteDialog, LoadingBar
- Theme system: `ChronixUITheme` + CSS var tokens + light/dark presets
- Popup system: 12-placement math, trigger spec, z-index, focus-trap, body-scroll-lock
- Tree helpers: flatten / find / filter / map
- Form validation: `FieldState<T>` transactions + async-validator integration
- BEM naming (`cx-ui-{component}` prefix) with sticky-flag style injection

## Development

```bash
pnpm install
pnpm dev           # all packages in watch mode + example apps
pnpm test          # vitest suites
pnpm build         # tsup build for publishable packages + vite build for examples
pnpm ci-check      # format / lint / typecheck / test / build
```

Requires Node >= 20 and pnpm >= 9.

### Demo apps

| Product | Vue 3            | Vue 2.7          | React 18 / 19    |
| ------- | ---------------- | ---------------- | ---------------- |
| Gantt   | `localhost:8702` | `localhost:8703` | `localhost:8704` |
| Table   | `localhost:8711` | `localhost:8712` | `localhost:8713` |
| UI      | `localhost:8731` | `localhost:8732` | `localhost:8733` |

## License

[MIT](./LICENSE) © liaoyu1992
