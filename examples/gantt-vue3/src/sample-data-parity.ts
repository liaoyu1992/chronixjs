import {
  PARITY_RESOURCE_IDS,
  buildParityEvents,
  type ParityEvent,
} from '@chronixjs/golden-runner/parity-events';

import { todayLocalMidnight } from './sample-data';

import type { BarSpec, RowSpec } from '@chronixjs/gantt';

/**
 * Sample data for the chronix demo's **parity mode** (URL query
 * `?parity=true`). Mirrors the k-ui demo's `RESOURCES[]` +
 * `generateTestEvents()` so the two demos render the same id-paired
 * bars on the same id-paired rows. Imports from
 * `@chronixjs/golden-runner/parity-events` — the single source of
 * truth for the parity dataset (also consumed by `parity.spec.ts`).
 *
 * What this DOES NOT replicate:
 *
 * - k-ui's resource RENDER order (it groups by `baseName` internally,
 *   which chronix v0 doesn't model). Chronix renders rows in
 *   `PARITY_RESOURCE_IDS` order = the k-ui `RESOURCES[]` input order.
 *   Result: rendered Y will NOT match k-ui rendered Y. Cross-demo
 *   parity assertions in v0 only compare X + width (see
 *   `audit/PHASE_17_PARITY_INFRASTRUCTURE_DESIGN.md`).
 * - Resource metadata (`airportName` / `baseName` / `workshopName`).
 *   The 3 chronix-demo columns are filled with generic placeholders.
 * - Event styling (`backgroundColor` / per-event colors).
 *
 * What this DOES replicate:
 *
 * - 32 resource ids matching k-ui's RESOURCES.
 * - 25 events with `event-N` ids matching k-ui's events, plus
 *   identical (resourceId, startMs, endMs) tuples so X + width
 *   parity can hold.
 * - Progress values on the 4 events that carry them in the k-ui
 *   demo (event-1: 60%, event-2: 40%, event-3: 0%, event-17: 50%).
 */

export const sampleRowsParity: readonly RowSpec[] = PARITY_RESOURCE_IDS.map((id) => ({
  id,
  columns: {
    region: '海口',
    base: '海口基地',
    name: id,
  },
}));

function parityEventToBar(event: ParityEvent): BarSpec {
  return {
    id: event.id,
    rowId: event.resourceId,
    range: {
      start: new Date(event.startMs),
      end: new Date(event.endMs),
    },
    dprIntent: 'crisp-pixel',
    ...(event.progressValue !== undefined
      ? {
          progress: {
            value: event.progressValue,
          },
        }
      : {}),
  };
}

/**
 * Build the parity-mode bar set anchored at the demo's notion of
 * "today" (`todayLocalMidnight()`, the same anchor the default
 * sample data uses). Returned at module-load via `sampleBarsParity`
 * below; the function is exported for tests that want a different
 * anchor.
 */
export function buildSampleBarsParity(todayMs: number): readonly BarSpec[] {
  return buildParityEvents(todayMs).map(parityEventToBar);
}

export const sampleBarsParity: readonly BarSpec[] = buildSampleBarsParity(
  todayLocalMidnight().getTime(),
);
