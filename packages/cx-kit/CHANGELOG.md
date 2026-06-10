# @chronixjs/cx-kit

## 0.1.0

### Minor Changes

- f0eab60: v0.1.0 release. Promotes chronix-table + supporting `@chronixjs/cx-kit` headless primitives from alpha to GA. Adds 22 consumer-tunable extensions on top of the initial alpha surface, plus Tier 4 Validation + Tier 3 Multi-filter — both chronix-NEW IR variants. cx-kit ships 5/5 primitives (KitVirtualList + KitSlider + KitInputRange + KitColorPicker + KitAutocomplete) all consumed by chronix-table adapters. 172 consecutive zero-bug-in-production phases shipped under the AGGRESSIVE phase-bundling discipline.

  **Cell-style editor** (4 axes × per-side × HSV picker):
  - 4-axis cell-style editor — background + text + font + border each with independent HSV picker (Phases 99.2 + 99.2.1 + 99.2.2 + 99.2.3 + 99.2.3.1 + 99.2.3.2)
  - Per-side border overrides (top/right/bottom/left × color/width/style) with 5-button segmented control (Phase 99.2.3.1)
  - HSV picker disclosure on both bg/text AND border tabs (Phase 99.2.3.2)
  - Controlled-mode SFC prop `cellStyleByRowIdColId?` (Phase 99.2.4)
  - Preset color palette + per-axis recent-color LRU ring (Phase 99.2.5)
  - 3-tier font-weight precision: Bold toggle + 9-button grid + 1-1000 continuous slider (Phase 99.2.2 + 99.2.2.1 + 99.2.2.2)

  **Advanced filter typeahead** (ALL 14 originally-scoped sub-phases):
  - 4-slot type-aware token detector — column / operator / conjunction / value (Phase 100.2.1)
  - Value-slot DSL formatting + per-column unique-value source (Phase 100.2.2)
  - Per-type operator filtering with custom column-type override (Phase 100.2.3 + 100.2.3.1)
  - Histogram count badge per value suggestion (Phase 100.2.2.2)
  - Date-value formatter prop (Phase 100.2.2.3)
  - I18n operator labels prop (Phase 100.2.3.2)
  - Auto-trigger after column/operator/keyword commits (Phase 100.2.4)
  - Auto-scroll active item into view (Phase 100.2.6)
  - String-literal-internal commit (insert bare value + closing quote) (Phase 100.2.2.4)
  - Per-slot-kind recent LRU rings (Phase 100.2.5)
  - SSR-async value getter prop with request-id race-discard (Phase 100.2.2.1)

  **Validation** (Phase 101, Tier 4 Enterprise B-class chronix-NEW):
  - Per-column `validator?: (value, row) => string | EditValidationError | null` (sync only in v0.1.0)
  - 3-axis invalid-cell marker: `.cx-table-cell--invalid` CSS class + `data-cell-invalid="true"` + `aria-invalid="true"`
  - `cell-edit-stop` payload extended in-place with `validationError?: EditValidationError`
  - Locked execution order: coerce → validator → outcome (validator NOT called when coerce fails)
  - Async validation parked for v0.1.x (request-id machinery deferred)

  **Multi-filter container** (Phase 102, Tier 3 Advanced B-class chronix-NEW):
  - New `MultiFilterSpec { type: 'multi'; colId; mode: 'AND' | 'OR'; filters: readonly MultiFilterChild[] }` extending FilterSpec union
  - `ColumnSpec.filterUi: 'text' | 'set' | 'multi'` literal widening (backwards-compat)
  - `ColumnSpec.multiFilterChildTypes?: readonly ('text' | 'number')[]` config (default `['text', 'text']`)
  - Native `<details><summary>N 个筛选器</summary>` disclosure + segmented AND/OR mode toggle
  - `filterPass` AND/OR-reducer combining child predicates with short-circuit evaluation
  - Set widget child + runtime add/remove buttons + nested groups parked for v0.1.x

  **Bug rate**: 0 production-logic bugs across 172 consecutive zero-bug phases (2026-05-23 through 2026-06-01). 27 typecheck/lint/format/test-infra frictions caught and fixed inline by the `/phase-close` discipline before status flips. Per-phase audit trail in `audit/TABLE_PHASE_*_DESIGN.md` + `audit/journal/2026-*.md`.

  **Test coverage**:
  - `@chronixjs/table` (core): 696 vitest
  - `@chronixjs/cx-kit` (table-facing primitives): 151 vitest (5/5 primitives complete)
  - `@chronixjs/table-vue3`: 543 SFC vitest
  - `@chronixjs/table-vue2`: 533 SFC vitest
  - `@chronixjs/table-react`: 513 SFC vitest

  **Adapter parity**: confirmed via `audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md` — all Tier 1-5 features wired symmetrically in all 3 adapters. Adapter-internal idiom differences (Vue Options API vs Composition API vs React hooks) have identical observable DOM + emitted-event behavior.

  **API surface freeze**: documented in `audit/TABLE_API_SURFACE_v0.1.0.md` — every exported type / function / constant / SFC prop / emit / TableHandle method inventoried per package. Post-v0.1.0 stability commitment applies: backwards-compatible additions only in v0.1.x; minor breaks require CHANGELOG migration notes in v0.2; SemVer-strict from v1.0.

  APIs may still shift before `1.0.0`. SemVer stability commitment begins at `1.0`. Install with the default dist-tag (no `@alpha` needed) once `pnpm changeset pre exit` rolls the workspace out of alpha mode (Phase 109).
