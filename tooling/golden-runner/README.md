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

Two complementary suites run under the same `verify` / `capture` scripts.

### Visual goldens (`tests/visual.spec.ts` → `goldens/<id>.png`)

Strict pixel-diff baselines (`maxDiffPixelRatio 0.001`). Captured: 6/30+
(all six timeline scales: `week-default`, `view-day`, `view-month`,
`view-season`, `view-half-year`, `view-year`). Known gap: half-year /
year load with x-scroll at range-start so today-anchored events sit
off-screen — those PNGs are mostly empty grid until a scroll-to-today
helper is added. Add new scenarios to `src/scenarios.ts`.

### Interaction recordings (`tests/interaction.spec.ts` → `recordings/<id>/`)

Each scenario writes `before.png`, `after.png`, and `log.json` (with
pointer/wheel event sequence + frozen-time metadata). The parity
assertion for chronix is the `log.json` state mutations, not the PNG
diff — pixel-comparing mid-interaction frames is too noisy. Currently
1 proof scenario (`wheel-scroll-right`). Add new recordings to
`src/recordings.ts` (declarative shell + imperative `perform(ctx)`).

## CSS class names from the reference demo

Selectors like `.demo-app-main` reference k-ui's demo DOM. They are
**queries against the oracle**, not chronix-owned class names. Chronix's
own CSS uses the `cx-` prefix (see `audit/BANNED_IDENTIFIERS.md`).
