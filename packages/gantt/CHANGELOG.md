# @chronixjs/gantt

## 0.1.0-alpha.0

### Minor Changes

- Initial alpha release. Framework-agnostic gantt core (`@chronixjs/gantt`) + Vue 3 adapter (`@chronixjs/gantt-vue3`), feature-complete for the 2.0 demo-parity roadmap.

  Includes: 6 timeline views (day / week / month / season / halfYear / year); bar drag + edge resize + progress drag + cross-row drag + range-select-to-create + click-to-select; square + smooth Bézier dependency line routing with 7 built-in markers + custom marker shape; today line + today-cell background + axis grid lines + event continuation triangles; theme prop with 50 tokens; slot registry for full bar / link / header-cell render replacement; imperative handle (`changeView` / `prev` / `next` / `today` / `gotoDate` / `incrementDate` / `getDate` / `zoomTo` / `scrollToDate` / `getBarById` / `getBars` / `subscribe`); header toolbar with parity-shape string DSL.

  Test coverage: 712 vitest + 56 cross-demo parity assertions + 27 visual-regression scenarios + 32 Playwright unit tests + 50 ChronixTheme tokens + 361-item × 51-file catalog-completeness CI gate.

  APIs may shift before `1.0.0`. SemVer stability commitment begins at `1.0`. Install with the `@alpha` npm dist-tag.
