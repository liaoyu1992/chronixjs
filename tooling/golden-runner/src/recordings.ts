import {
  PROGRESS_TRIANGLE,
  REF_ATTR_NAMES,
  TIMELINE_BODY_RIGHT,
  TIMELINE_BODY_WRAPPER,
  eventBarByInstance,
  eventBarBySource,
  resourceRowBy,
} from './reference-dom-map.js';

import type { Locator, Page } from '@playwright/test';

export interface RecordingContext {
  readonly page: Page;
  readonly chart: Locator;
  /** Save a PNG keyframe under `recordings/<scenario.id>/<keyframeId>.png`. */
  snapshot: (keyframeId: string) => Promise<void>;
  /** Append a structured entry to `recordings/<scenario.id>/log.json`. */
  log: (entry: Record<string, unknown>) => void;
}

export interface InteractionRecording {
  id: string;
  description: string;
  /** Click this headerToolbar button before the recording starts (e.g. "日" / "周"). */
  viewToggleLabel?: string;
  perform: (ctx: RecordingContext) => Promise<void>;
}

export const INTERACTION_RECORDINGS: InteractionRecording[] = [
  {
    id: 'wheel-scroll-right',
    description: 'Horizontal wheel scroll on day-view timeline body (+400px x)',
    viewToggleLabel: '日',
    async perform({ page, chart, snapshot, log }) {
      await snapshot('before');

      const box = await chart.boundingBox();
      if (!box) throw new Error('chart locator returned no bounding box');

      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy);
      log({ kind: 'pointer-move', x: cx, y: cy });

      await page.mouse.wheel(400, 0);
      log({ kind: 'wheel', deltaX: 400, deltaY: 0 });
      await page.waitForTimeout(150);

      await snapshot('after');
    },
  },
  {
    id: 'progress-handle-drag',
    description:
      'Drag the first visible progress triangle right by +60px on day view. ' +
      'Exercises the separate-SVG-layer hit-test path; chronix parity here ' +
      'is the bbox delta + the resulting in-bar progress text mutation.',
    viewToggleLabel: '日',
    async perform({ page, chart, snapshot, log }) {
      // The progress SVG extends beyond the chart's overflow-clipped viewport,
      // so picking `.first()` in DOM order yields a triangle at x≈4000 that's
      // outside the visible chart and unhittable. Walk siblings until one is
      // actually in-viewport.
      const chartBox = await chart.boundingBox();
      if (!chartBox) throw new Error('chart locator returned no bounding box');

      const triangles = chart.locator(PROGRESS_TRIANGLE);
      const total = await triangles.count();
      let triangle = triangles.first();
      let bboxBefore = await triangle.boundingBox();
      let found = false;
      for (let i = 0; i < total; i += 1) {
        const candidate = triangles.nth(i);
        const b = await candidate.boundingBox();
        if (!b) continue;
        const cx = b.x + b.width / 2;
        const cy = b.y + b.height / 2;
        const inChart =
          cx >= chartBox.x &&
          cx <= chartBox.x + chartBox.width &&
          cy >= chartBox.y &&
          cy <= chartBox.y + chartBox.height;
        if (!inChart) continue;
        // Need room for a +60px rightward drag inside the chart viewport.
        if (cx + 60 > chartBox.x + chartBox.width) continue;
        triangle = candidate;
        bboxBefore = b;
        found = true;
        break;
      }
      if (!found || !bboxBefore) {
        throw new Error(
          `no in-viewport progress triangle with drag headroom (${total} total in DOM)`,
        );
      }

      const instanceId = await triangle.getAttribute(REF_ATTR_NAMES.instanceId);

      // The event bar above this triangle owns the progress text label. Snapshot
      // its text content before/after so chronix can be checked against the same
      // mutation, not just pixels.
      const eventBar = chart.locator(eventBarByInstance(instanceId ?? '')).first();
      const textBefore = (await eventBar.textContent())?.trim() ?? '';

      await snapshot('before');
      log({
        kind: 'state',
        when: 'before',
        instanceId,
        triangleBbox: bboxBefore,
        eventText: textBefore,
      });

      const startX = bboxBefore.x + bboxBefore.width / 2;
      const startY = bboxBefore.y + bboxBefore.height / 2;
      const endX = startX + 60;

      await page.mouse.move(startX, startY);
      log({ kind: 'pointer-move', x: startX, y: startY });

      await page.mouse.down();
      log({ kind: 'pointer-down', x: startX, y: startY });

      // Interpolated movement — emits ~10 intermediate pointermove events so the
      // recording captures drag-threshold crossing and any in-flight preview.
      await page.mouse.move(endX, startY, { steps: 10 });
      log({ kind: 'pointer-move', x: endX, y: startY, steps: 10 });

      await snapshot('mid');

      await page.mouse.up();
      log({ kind: 'pointer-up', x: endX, y: startY });
      await page.waitForTimeout(150);

      const bboxAfter = await triangle.boundingBox();
      const textAfter = (await eventBar.textContent())?.trim() ?? '';
      log({
        kind: 'state',
        when: 'after',
        instanceId,
        triangleBbox: bboxAfter,
        eventText: textAfter,
      });

      await snapshot('after');
    },
  },
  {
    id: 'event-drag',
    description:
      'Drag the body of event-7 (A32-发动机大修) right by +60px on day view. ' +
      'Bar shifts by +1 hour in time. Validates BarDragTransaction parity.',
    viewToggleLabel: '日',
    async perform({ page, chart, snapshot, log }) {
      // event-7 spans dayMinus1 9:00 → dayPlus10 16:00 — its body crosses the
      // entire day-view chart, so any in-viewport x on its bar works. Picking
      // the bar by its source id keeps the scenario deterministic across runs.
      const bar = chart.locator(eventBarBySource('event-7')).first();
      const bboxBefore = await bar.boundingBox();
      if (!bboxBefore) throw new Error('event-7 bar not found in day view');

      // The chart root includes the resource sidebar — its left edge is
      // NOT the timeline body's left edge. Use the timeline-body-right pane
      // for the clickable visible-band bounds.
      const bodyRight = chart.locator(TIMELINE_BODY_RIGHT).first();
      const bodyBox = await bodyRight.boundingBox();
      if (!bodyBox) throw new Error('timeline body-right pane not found');

      // Click 100px in from the timeline body's left edge so the click lands
      // squarely on the bar body (clear of the bar's left resizer + sidebar
      // edge). Drag right by 60px (= 1 hour at slot=60). Make sure the end
      // stays inside the body viewport.
      const startX = bodyBox.x + 100;
      const startY = bboxBefore.y + bboxBefore.height / 2;
      const endX = startX + 60;
      if (endX > bodyBox.x + bodyBox.width - 20) {
        throw new Error('event-drag: not enough rightward headroom in body viewport');
      }

      await snapshot('before');
      log({
        kind: 'state',
        when: 'before',
        eventId: 'event-7',
        barBbox: bboxBefore,
      });

      await page.mouse.move(startX, startY);
      log({ kind: 'pointer-move', x: startX, y: startY });
      await page.mouse.down();
      log({ kind: 'pointer-down', x: startX, y: startY });
      await page.mouse.move(endX, startY, { steps: 10 });
      log({ kind: 'pointer-move', x: endX, y: startY, steps: 10 });

      await snapshot('mid');

      await page.mouse.up();
      log({ kind: 'pointer-up', x: endX, y: startY });
      await page.waitForTimeout(150);

      const bboxAfter = await bar.boundingBox();
      log({
        kind: 'state',
        when: 'after',
        eventId: 'event-7',
        barBbox: bboxAfter,
      });

      await snapshot('after');
    },
  },
  {
    id: 'select-to-create',
    description:
      "Drag horizontally on an empty row (12车间, no events in today's day " +
      "view) to define a new date range. Auto-dismisses the upstream's " +
      'title-prompt so teardown stays clean. Captures the pointer-event ' +
      'flow + the body-wrapper offset; parity is asserted by the slot- ' +
      'width and bar-placement parity tests (the pixel↔time math is shared ' +
      'with CalendarRangeSelect, so a dedicated commit-result parity would ' +
      'be tautological — see audit/journal/2026-05-13.md for the analysis).',
    viewToggleLabel: '日',
    async perform({ page, chart, snapshot, log }) {
      // Auto-dismiss the upstream's title prompt. We do NOT accept it with a
      // sentinel: confirmed empirically that the demo creates the event in
      // its store but the scheduler doesn't re-render a bar for it in day
      // view (likely an allDay/view-filter quirk). Without a rendered bar
      // there's no oracle to compare chronix's commit against, and the
      // commit math is anyway redundant with the other parity tests — see
      // the journal entry. Dismiss is the clean teardown.
      page.on('dialog', (dialog) => {
        void dialog.dismiss();
      });

      const bodyRight = chart.locator(TIMELINE_BODY_RIGHT).first();
      const bodyBox = await bodyRight.boundingBox();
      if (!bodyBox) throw new Error('timeline body-right pane not found');

      // Capture the wrapper's left edge for the parity test's reference.
      const wrapper = chart.locator(TIMELINE_BODY_WRAPPER).first();
      const wrapperBox = await wrapper.boundingBox();
      if (!wrapperBox) throw new Error('timeline body wrapper not found');

      // Resource row '12' (空港维修基地 - 12车间) — its only event in the
      // test set (event-25, dayPlus15 → dayPlus30) is far outside today's
      // day-view range, so the body strip for this row is empty.
      const targetRow = page.locator(resourceRowBy('12')).first();
      const rowBox = await targetRow.boundingBox();
      if (!rowBox) throw new Error('resource row 12 not found');
      const clickY = rowBox.y + rowBox.height / 2;

      const startX = bodyBox.x + 100; // ~hour 1.7 of day view (60px = 1h)
      const endX = startX + 180; // drag 3 hours rightward
      if (endX > bodyBox.x + bodyBox.width - 20) {
        throw new Error('select-to-create: not enough rightward headroom');
      }

      await snapshot('before');
      log({
        kind: 'state',
        when: 'before',
        rowId: '12',
        rowBbox: rowBox,
        wrapperLeft: wrapperBox.x,
      });

      await page.mouse.move(startX, clickY);
      log({ kind: 'pointer-move', x: startX, y: clickY });
      await page.mouse.down();
      log({ kind: 'pointer-down', x: startX, y: clickY });
      await page.mouse.move(endX, clickY, { steps: 10 });
      log({ kind: 'pointer-move', x: endX, y: clickY, steps: 10 });

      await snapshot('mid');

      await page.mouse.up();
      log({ kind: 'pointer-up', x: endX, y: clickY });
      await page.waitForTimeout(150);

      log({ kind: 'state', when: 'after', rowId: '12' });

      await snapshot('after');
    },
  },
];
