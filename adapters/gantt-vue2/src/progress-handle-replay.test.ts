import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { BarProgressPayload } from './use-gantt-pointer.js';
import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';
import type Vue from 'vue';

/**
 * SFC-level recording-replay for `progress-handle-drag` (Phase 51 vue2
 * port of `adapters/gantt-vue3/src/progress-handle-replay.test.ts`).
 *
 * Phase 3 already replays the recorded numbers through the math layer
 * (`pointer-capture-session.test.ts: 'reproduces the recorded ... drag
 * math'`). This file goes one layer up: replay the same recorded
 * pointer inputs through `<ChronixGantt>` end-to-end and assert the
 * emitted `bar-progress` payload reproduces the recorded progress
 * transition (50 % → 51 %).
 *
 * The recording lives in `tooling/golden-runner/recordings/progress-
 * handle-drag/log.json` and is shared with the vue3 replay test. Same
 * 6060-px bar width assumption + same handle-center math.
 */

interface RecordingPointerEntry {
  readonly kind: 'pointer-down' | 'pointer-move' | 'pointer-up';
  readonly x: number;
  readonly y: number;
  readonly steps?: number;
}
interface RecordingStateEntry {
  readonly kind: 'state';
  readonly when: 'before' | 'after';
  readonly eventText: string;
}
interface RecordingSnapshotEntry {
  readonly kind: 'snapshot';
  readonly keyframeId: string;
}
type RecordingEntry = RecordingPointerEntry | RecordingStateEntry | RecordingSnapshotEntry;
interface Recording {
  readonly id: string;
  readonly entries: readonly RecordingEntry[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const recordingPath = resolve(
  __dirname,
  '../../../tooling/golden-runner/recordings/progress-handle-drag/log.json',
);
const recording = JSON.parse(readFileSync(recordingPath, 'utf8')) as Recording;

function findPointerEntry(kind: 'pointer-down' | 'pointer-up'): RecordingPointerEntry {
  for (const entry of recording.entries) {
    if (entry.kind === kind) return entry;
  }
  throw new Error(`Recording missing a ${kind} entry`);
}
function findStateEntry(when: 'before' | 'after'): RecordingStateEntry {
  for (const entry of recording.entries) {
    if (entry.kind === 'state' && entry.when === when) return entry;
  }
  throw new Error(`Recording missing a state entry when='${when}'`);
}
function parsePercent(eventText: string): number {
  const match = /(\d+)%/.exec(eventText);
  if (match?.[1] === undefined) {
    throw new Error(`No "<N>%" in eventText: ${eventText}`);
  }
  return Number(match[1]);
}

const MS_PER_HOUR = 60 * 60 * 1000;

const today = new Date('2026-05-13T00:00:00Z');
today.setHours(0, 0, 0, 0);
const todayMs = today.getTime();

const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];
const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date('2026-05-13T00:00:00Z'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

const RECORDED_BAR_WIDTH_PX = 6060;
const HOURS_FOR_RECORDED_WIDTH = RECORDED_BAR_WIDTH_PX / 60;

const GanttForTest = ChronixGantt as unknown as typeof Vue;

describe('<ChronixGantt> progress-handle drag — recording replay (vue2 SFC port)', () => {
  it('reproduces the recorded 50% → 51% progress change with the recorded barWidth + deltaX', async () => {
    const beforePct = parsePercent(findStateEntry('before').eventText);
    const afterPct = parsePercent(findStateEntry('after').eventText);
    const pointerDown = findPointerEntry('pointer-down');
    const pointerUp = findPointerEntry('pointer-up');
    const deltaX = pointerUp.x - pointerDown.x;

    expect(beforePct).toBe(50);
    expect(afterPct).toBe(51);
    expect(deltaX).toBeCloseTo(60, 5);

    const a33: BarSpec = {
      id: 'a33',
      rowId: 'r1',
      range: {
        start: new Date(todayMs),
        end: new Date(todayMs + HOURS_FOR_RECORDED_WIDTH * MS_PER_HOUR),
      },
      progress: { value: beforePct },
      pointerOverlayId: 'progress-handle',
      dprIntent: 'crisp-pixel',
    };
    const wrapper = mount(GanttForTest, {
      propsData: {
        bars: [a33],
        rows,
        axisInput,
        editable: true,
      },
    });

    const handleContentX = 0 + (beforePct / 100) * RECORDED_BAR_WIDTH_PX;
    const handleContentY = 23;
    const svg = wrapper.find('svg.cx-gantt-body');

    await svg.trigger('pointerdown', {
      clientX: handleContentX,
      clientY: handleContentY,
      button: 0,
      pointerId: 1,
    });
    await svg.trigger('pointermove', {
      clientX: handleContentX + deltaX,
      clientY: handleContentY,
      pointerId: 1,
    });
    await svg.trigger('pointerup', {
      clientX: handleContentX + deltaX,
      clientY: handleContentY,
      pointerId: 1,
    });

    const emitted = wrapper.emitted('bar-progress') as [BarProgressPayload][] | undefined;
    expect(emitted).toBeTruthy();
    expect(emitted!).toHaveLength(1);
    const payload = emitted![0]![0];
    expect(payload.barId).toBe('a33');
    expect(payload.oldProgress).toBe(beforePct);
    // Math: 50 + (60 / 6060) × 100 ≈ 50.9901; rounds to 51.
    expect(payload.newProgress).toBeCloseTo(beforePct + (deltaX / RECORDED_BAR_WIDTH_PX) * 100, 5);
    expect(Math.round(payload.newProgress)).toBe(afterPct);

    // No other transaction kind should fire on a handle-only drag.
    expect(wrapper.emitted('bar-drop')).toBeFalsy();
    expect(wrapper.emitted('bar-resize')).toBeFalsy();
  });
});
