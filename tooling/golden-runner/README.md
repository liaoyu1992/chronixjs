# @chronixjs/golden-runner

Playwright-driven golden capture for `@chronixjs/gantt` parity (Phase 0).

The k-ui demo at `d:/work/k-ui/examples/gantt/vue3` is the **parity oracle**:
once captured, every chronix implementation change must reproduce the same
DOM render output pixel-for-pixel against the same scenarios.

## Prereqs

1. k-ui demo running locally:

   ```sh
   cd d:/work/k-ui/examples/gantt/vue3
   pnpm dev      # vite, http://localhost:8701/
   ```

2. Playwright browsers installed (one-time, ~200 MB):

   ```sh
   pnpm --filter @chronixjs/golden-runner exec playwright install chromium
   ```

## Capture goldens (first run / after intentional change)

```sh
pnpm --filter @chronixjs/golden-runner capture
```

Writes PNGs into `goldens/<scenario>.png` (the project/platform suffix is
suppressed via `snapshotPathTemplate` since we pin a single browser + viewport).
Commit the deltas with a clear message — these are the baseline.

## Verify (in CI / before merge)

```sh
pnpm --filter @chronixjs/golden-runner verify
```

Fails if any rendered frame deviates from the committed baseline beyond
`maxDiffPixelRatio: 0.001`.

## Frozen reference time

All scenarios pin `Date` to `2026-05-13T00:00:00Z` (Wednesday) via
`page.clock.install` **before navigation**, so the demo's
`generateTestEvents()` (date-anchored at module load) produces identical
events on every machine. Change `FROZEN_TIME_ISO` in `src/config.ts` only
together with a full re-capture.

## Sidebar exclusion

Screenshots are bound to `.demo-app-main` (the gantt panel), not the full
viewport. The left sidebar of `DemoApp.vue` is instructional Chinese text
that would generate noisy diffs on doc edits.

## Scenarios

Currently 1 scenario (`week-default`) to prove the pipeline. The full
~30-scenario suite covers: 6 timeline scales × default state, weekends
off, today-line variants, line-style/marker permutations, progress states,
drag/resize/select-create/click-delete recordings (interaction JSON, Phase 0.5).

Add new scenarios to `src/scenarios.ts`.

## CSS class names from the reference demo

Selectors like `.demo-app-main` reference k-ui's demo DOM. They are
**queries against the oracle**, not chronix-owned class names. Chronix's
own CSS uses the `cx-` prefix (see `audit/BANNED_IDENTIFIERS.md`).
