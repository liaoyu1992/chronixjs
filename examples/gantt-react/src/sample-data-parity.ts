import {
  PARITY_RESOURCE_IDS,
  buildParityEvents,
  buildParityLinks,
  type ParityEvent,
  type ParityLink,
} from '@chronixjs/golden-runner/parity-events';

import { todayLocalMidnight } from './sample-data.js';

import type { BarSpec, LinkSpec, RowSpec } from '@chronixjs/gantt';

/**
 * Sample data for the chronix-react demo's **parity mode** (URL query
 * `?parity=true`). Mirrors the chronix-vue3 demo's parity-mode dataset —
 * 32 resources × 25 events sourced from
 * `@chronixjs/golden-runner/parity-events`, the single source of truth
 * for the parity dataset (also consumed by vue3 + `parity.spec.ts`).
 *
 * What this DOES NOT replicate:
 *
 * - The original resource RENDER order (it groups by
 *   `baseName` internally, which chronix v0 doesn't model). Chronix
 *   renders rows in `PARITY_RESOURCE_IDS` order = the parity
 *   reference's `RESOURCES[]` input order. Cross-demo parity
 *   assertions in v0 only compare X + width (see
 *   `audit/PHASE_17_PARITY_INFRASTRUCTURE_DESIGN.md`).
 * - Resource metadata (`airportName` / `baseName` / `workshopName`).
 *   The chronix-react demo column is filled with generic placeholders.
 * - Event styling (`backgroundColor` / per-event colors).
 *
 * What this DOES replicate:
 *
 * - 32 resource ids matching the original RESOURCES.
 * - 25 events with `event-N` ids matching the original spec's
 *   events, plus identical (resourceId, startMs, endMs) tuples so X +
 *   width parity can hold.
 * - Progress values on the 4 events that carry them in the parity
 *   original demo (event-1: 60%, event-2: 40%, event-3: 0%, event-17:
 *   50%).
 */

export const sampleRowsParity: readonly RowSpec[] = PARITY_RESOURCE_IDS.map((id) => ({
  id,
  columns: { name: id },
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
    title: event.title,
    ...(event.backgroundColor !== undefined
      ? { style: { backgroundColor: event.backgroundColor } }
      : {}),
    ...(event.progressValue !== undefined
      ? {
          progress: {
            value: event.progressValue,
          },
        }
      : {}),
  };
}

function parityLinkToSpec(link: ParityLink): LinkSpec {
  return {
    id: link.id,
    fromBarId: link.fromBarId,
    toBarId: link.toBarId,
    routing: 'square',
    marker: 'arrow',
  };
}

/**
 * Build the parity-mode bar set anchored at the demo's notion of
 * "today" (`todayLocalMidnight()`, the same anchor the default
 * sample data uses).
 */
export function buildSampleBarsParity(todayMs: number): readonly BarSpec[] {
  return buildParityEvents(todayMs).map(parityEventToBar);
}

export const sampleBarsParity: readonly BarSpec[] = buildSampleBarsParity(
  todayLocalMidnight().getTime(),
);

/**
 * Parity-mode link set, mirroring the 8-edge curated subset declared
 * in `@chronixjs/golden-runner/parity-events`. Threaded through the
 * chronix demo's parity mode so cross-demo `useLineEventColor`
 * assertions see equivalent dependency graphs on both sides.
 */
export const sampleLinksParity: readonly LinkSpec[] = buildParityLinks().map(parityLinkToSpec);
