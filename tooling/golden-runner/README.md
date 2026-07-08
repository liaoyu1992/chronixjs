# @chronixjs/golden-runner

Playwright-driven golden capture for `@chronixjs/gantt` visual + interaction parity.

A locally-hosted chronix demo is the **spec**: once captured, every implementation change must reproduce the same DOM render output pixel-for-pixel against the same scenarios.

## Prereqs

1. The demo(s) you intend to capture/verify must be running locally. Port map:

   | Demo        | Port | pnpm filter                      | Env override                   |
   | ----------- | ---- | -------------------------------- | ------------------------------ |
   | gantt-vue3  | 8702 | `@chronixjs/example-gantt-vue3`  | `CHRONIX_DEMO_URL`             |
   | gantt-vue2  | 8703 | `@chronixjs/example-gantt-vue2`  | `CHRONIX_VUE2_DEMO_URL`        |
   | gantt-react | 8704 | `@chronixjs/example-gantt-react` | `CHRONIX_REACT_DEMO_URL`       |
   | table-vue3  | 8711 | `@chronixjs/example-table-vue3`  | `CHRONIX_TABLE_VUE3_DEMO_URL`  |
   | table-vue2  | 8712 | `@chronixjs/example-table-vue2`  | `CHRONIX_TABLE_VUE2_DEMO_URL`  |
   | table-react | 8713 | `@chronixjs/example-table-react` | `CHRONIX_TABLE_REACT_DEMO_URL` |

   ```sh
   pnpm --filter @chronixjs/example-gantt-vue3 dev      # serves on http://localhost:8702/
   pnpm --filter @chronixjs/example-gantt-vue2 dev      # 8703
   pnpm --filter @chronixjs/example-gantt-react dev     # 8704
   pnpm --filter @chronixjs/example-table-vue3 dev      # 8711
   pnpm --filter @chronixjs/example-table-vue2 dev      # 8712
   pnpm --filter @chronixjs/example-table-react dev     # 8713
   ```

2. Playwright browsers installed (one-time, ~200 MB):

   ```sh
   pnpm --filter @chronixjs/golden-runner exec playwright install chromium
   ```

## Capture goldens (first run / after intentional change)

There are four tracks, each with its own `<capture|verify>` pair. Capture writes
baselines; verify diffs against them. Capture commands require the relevant
demo server(s) from the table above.

### Gantt per-adapter visual goldens (recommended entry point)

```sh
pnpm --filter @chronixjs/golden-runner chronix-capture         # vue3 (8702) → goldens/chronix-view-*.png
pnpm --filter @chronixjs/golden-runner chronix-vue2-capture    # vue2 (8703) → goldens/chronix-vue2-view-*.png
pnpm --filter @chronixjs/golden-runner chronix-react-capture   # react(8704) → goldens/chronix-react-view-*.png
```

Each adapter captures 5 views (日 / 月 / 季 / 半年 / 年) against the same
`VISUAL_SCENARIOS` registry. The project/platform suffix is suppressed via
`snapshotPathTemplate` since a single browser + viewport is pinned. Commit the
deltas with a clear message — these are the baseline.

### Table per-adapter VRT

Requires all 3 table demos (8711 / 8712 / 8713) running. Writes 8 scenarios ×
3 adapters into `goldens/table-cross-demo-baselines/<adapter>/*.png` via a
gated capture spec (env `TABLE_VRT_CAPTURE=true`); the matching verify spec
uses `TABLE_VRT_RUN=true`.

```sh
pnpm --filter @chronixjs/golden-runner table-vrt-capture
pnpm --filter @chronixjs/golden-runner table-vrt-verify
```

Tolerance is stricter than gantt visual: `maxDiffPixelRatio: 0` + `threshold:
0.2` (pixel-perfect modulo AA).

### Generic / reference-against-chronix

```sh
pnpm --filter @chronixjs/golden-runner capture     # all specs, --update-snapshots
pnpm --filter @chronixjs/golden-runner cross-demo-capture   # needs reference demo at 8701
```

## Verify (in CI / before merge)

Mirror each capture command with `-verify`:

```sh
pnpm --filter @chronixjs/golden-runner chronix-verify
pnpm --filter @chronixjs/golden-runner chronix-vue2-verify
pnpm --filter @chronixjs/golden-runner chronix-react-verify
pnpm --filter @chronixjs/golden-runner table-vrt-verify
pnpm --filter @chronixjs/golden-runner verify       # everything
```

Gantt visual goldens fail on `maxDiffPixelRatio: 0.001`; table VRT uses
pixel-perfect tolerance (see above). Verify never re-writes baselines — the
table-vrt and cross-demo capture paths are gated behind env vars so a stray
`--update-snapshots` cannot silently corrupt the frozen set.

## Frozen reference time

All scenarios pin `Date` to `2026-05-13T00:00:00Z` (Wednesday) via `page.clock.install` **before navigation**, so the demo's `generateTestEvents()` (date-anchored at module load) produces identical events on every machine. Change `FROZEN_TIME_ISO` in `src/config.ts` only together with a full re-capture.

## Sidebar exclusion

Screenshots are bound to `.cx-gantt-wrapper` (the gantt chart itself), not the full viewport. The left sidebar of the demo app is instructional Chinese text that would generate noisy diffs on doc edits; per-adapter specs also hide `.cx-demo-side` / `.cx-demo-header` via injected CSS.

## Scenarios

Several complementary suites run under the capture/verify scripts above.

### Gantt per-adapter visual goldens

`chronix-visual.spec.ts` (vue3), `chronix-visual-vue2.spec.ts`,
`chronix-visual-react.spec.ts` — 5 timeline views each (`view-day`, `view-month`,
`view-season`, `view-half-year`, `view-year`; `week-default` is vue3-only because
chronix defaults to day view). Each adapter captures `div.cx-gantt-wrapper` at
its natural content width. Registry: `src/scenarios.ts`.

### Visual goldens — reference demo (`tests/visual.spec.ts` → `goldens/<id>.png`)

Strict pixel-diff baselines (`maxDiffPixelRatio 0.001`) against the original
spec demo. 6/30+ captured (all six timeline scales: `week-default`, `view-day`,
`view-month`, `view-season`, `view-half-year`, `view-year`). Add new scenarios
to `src/scenarios.ts`.

### Interaction recordings (`tests/interaction.spec.ts` → `recordings/<id>/`)

Each scenario writes `before.png`, `after.png`, and `log.json` (with pointer/wheel event sequence + frozen-time metadata). The parity assertion is the `log.json` state mutations, not the PNG diff — pixel-comparing mid-interaction frames is too noisy. Add new recordings to `src/recordings.ts`.

### Table per-adapter VRT (`tests/table-vrt-*.spec.ts`)

8 scenarios (`default-load`, `sort-name-asc`, `filter-row-visible`,
`pinned-left-column`, `column-visibility-menu-open`, `cell-edit-active`,
`tool-panel-columns-open`, `invalid-cell-marker`) × 3 adapters, each capturing
`.demo-page__table:first-of-type` from the table example demo. Pixel-perfect
tolerance. Registry: `src/table-cross-demo-scenarios.ts`.

## CSS class names

Gantt specs reference `.cx-demo-main` / `.cx-demo-side` / `.cx-demo-app` (the gantt demo app's DOM); table specs reference `.demo-app-main` / `.demo-app-sidebar`. Chronix's own component CSS uses the `cx-` prefix (`cx-gantt-*`, `cx-table-*`, `cx-ui-*`).
