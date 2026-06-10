# @chronixjs/golden-runner

Playwright-driven golden capture for `@chronixjs/gantt` visual + interaction parity.

A locally-hosted chronix demo is the **spec**: once captured, every implementation change must reproduce the same DOM render output pixel-for-pixel against the same scenarios.

## Prereqs

1. The gantt-vue3 demo running locally on `http://localhost:8702/` (configurable via `CHRONIX_DEMO_URL`):

   ```sh
   pnpm --filter @chronixjs/example-gantt-vue3 dev   # serves on http://localhost:8702/
   ```

2. Playwright browsers installed (one-time, ~200 MB):

   ```sh
   pnpm --filter @chronixjs/golden-runner exec playwright install chromium
   ```

## Capture goldens (first run / after intentional change)

```sh
pnpm --filter @chronixjs/golden-runner capture
```

Writes PNGs into `goldens/<scenario>.png` (the project/platform suffix is suppressed via `snapshotPathTemplate` since we pin a single browser + viewport). Commit the deltas with a clear message — these are the baseline.

## Verify (in CI / before merge)

```sh
pnpm --filter @chronixjs/golden-runner verify
```

Fails if any rendered frame deviates from the committed baseline beyond `maxDiffPixelRatio: 0.001`.

## Frozen reference time

All scenarios pin `Date` to `2026-05-13T00:00:00Z` (Wednesday) via `page.clock.install` **before navigation**, so the demo's `generateTestEvents()` (date-anchored at module load) produces identical events on every machine. Change `FROZEN_TIME_ISO` in `src/config.ts` only together with a full re-capture.

## Sidebar exclusion

Screenshots are bound to `.demo-app-main` (the gantt panel), not the full viewport. The left sidebar of `DemoApp.vue` is instructional Chinese text that would generate noisy diffs on doc edits.

## Scenarios

Two complementary suites run under the same `verify` / `capture` scripts.

### Visual goldens (`tests/visual.spec.ts` → `goldens/<id>.png`)

Strict pixel-diff baselines (`maxDiffPixelRatio 0.001`). Captured: 6/30+ (all six timeline scales: `week-default`, `view-day`, `view-month`, `view-season`, `view-half-year`, `view-year`). Add new scenarios to `src/scenarios.ts`.

### Interaction recordings (`tests/interaction.spec.ts` → `recordings/<id>/`)

Each scenario writes `before.png`, `after.png`, and `log.json` (with pointer/wheel event sequence + frozen-time metadata). The parity assertion is the `log.json` state mutations, not the PNG diff — pixel-comparing mid-interaction frames is too noisy. Add new recordings to `src/recordings.ts`.

## CSS class names

Selectors like `.demo-app-main` reference the demo app's DOM. Chronix's own CSS uses the `cx-` prefix.
