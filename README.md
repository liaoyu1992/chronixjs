# Chronix

A component library monorepo. Published under the npm scope [`@chronixjs`](https://www.npmjs.com/org/chronixjs).

Source: [github.com/liaoyu1992/chronixjs](https://github.com/liaoyu1992/chronixjs)

> **Status: alpha.** Published under the `alpha` npm dist-tag. Install with `@alpha`. APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Packages

| Package                                    | Description                                               | Install                                    |
| ------------------------------------------ | --------------------------------------------------------- | ------------------------------------------ |
| [`@chronixjs/gantt`](./packages/gantt)     | Framework-agnostic gantt core (types + pure helpers + IR) | `pnpm add @chronixjs/gantt@alpha`          |
| [`@chronixjs/gantt-vue3`](./adapters/vue3) | Vue 3 component + composables built on the core           | `pnpm add @chronixjs/gantt-vue3@alpha vue` |
| `@chronixjs/table`                         | Planned                                                   | —                                          |
| `@chronixjs/input`                         | Planned                                                   | —                                          |

`@chronixjs/gantt-vue3` re-exports the runtime component layer; most Vue consumers install only it (its `dependencies` pulls the core transitively). Install `@chronixjs/gantt` directly only when consuming the framework-agnostic types / IR / pure helpers in non-Vue code.

## Features (gantt)

- 6 timeline views: day / week / month / season (3-month) / halfYear / year
- Bar drag, edge resize, progress drag, cross-row drag, range-select-to-create, click-to-select
- Dependency lines: square + smooth Bézier routing, 7 built-in markers + custom marker shape, per-link color override, source-bar color cascade
- Today line + today-cell background + axis grid lines + event continuation triangles
- Theme prop (50 tokens) for colors / typography / borders
- Slot registry for full bar / link / header-cell render replacement
- Imperative handle: `changeView` / `prev` / `next` / `today` / `gotoDate` / `incrementDate` / `getDate` / `zoomTo` / `scrollToDate` / `getBarById` / `getBars` / `subscribe`
- Header toolbar with k-ui-parity string DSL (`{ left, center, right }`)
- Per-bar / per-link class-name + render callbacks

## Test coverage

- 712 vitest (329 core + 372 Vue 3 adapter + 11 demo) — pure helpers, composables, SFC behavior
- 32 Playwright unit (golden-runner)
- 56 cross-demo parity assertions vs a mature reference gantt — bar bbox, axis tick positions, slot widths, dependency line set, marker defs, toolbar widgets, today line, today cell, drag distance gate, viewport-clipping cascade, bar text count, link stroke colors
- 27 visual-regression scenarios at the demo level
- 361-item × 51-file catalog-completeness CI gate

## Development

```bash
pnpm install
pnpm dev           # all packages in watch mode + example app at http://localhost:8702
pnpm test          # vitest suites
pnpm build         # tsup build for publishable packages + vite build for example
pnpm ci-check      # format / lint / typecheck / test / build / audit:names / audit:catalog
```

Requires Node >= 20 and pnpm >= 9.

The example app at [`examples/gantt-vue3`](./examples/gantt-vue3) exercises every demo-parity feature with URL-driven config toggles (`?view=week&editable=true&todayLine=true&...`).

## License

[MIT](./LICENSE) © liaoyu1992
