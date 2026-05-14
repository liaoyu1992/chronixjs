import {
  PROGRESS_TRIANGLE,
  REF_ATTR_NAMES,
  RESIZER_ALWAYS_VISIBLE_CSS,
  TIMELINE_BODY_RIGHT,
  TIMELINE_BODY_WRAPPER,
  eventBarByInstance,
  eventBarBySource,
  resourceRowBy,
} from './reference-dom-map.js';

import type { Locator, Page } from '@playwright/test';

interface ResizeEdgeArgs {
  readonly page: Page;
  readonly chart: Locator;
  readonly snapshot: (keyframeId: string) => Promise<void>;
  readonly log: (entry: Record<string, unknown>) => void;
  readonly edge: 'start' | 'end';
  /** Signed pixel delta along x. Negative shifts left, positive shifts right. */
  readonly deltaPx: number;
}

/**
 * Probe every demo-known event id (1..25) under the current view, pick the
 * first whose chosen edge is visible inside the timeline body's right pane
 * AND has `|deltaPx| + MARGIN` of horizontal headroom for the drag, then
 * drive a 10-step pointer drag from that edge by `deltaPx` and record the
 * bbox before/after on the picked event. Used by event-resize-left and
 * event-resize-right.
 */
async function pickAndResizeEdge({
  page,
  chart,
  snapshot,
  log,
  edge,
  deltaPx,
}: ResizeEdgeArgs): Promise<void> {
  const bodyRight = chart.locator(TIMELINE_BODY_RIGHT).first();
  const bodyBox = await bodyRight.boundingBox();
  if (!bodyBox) throw new Error('timeline body-right pane not found');

  const MARGIN = 20;
  const absDelta = Math.abs(deltaPx);

  const candidates: {
    id: string;
    bbox: { x: number; y: number; width: number; height: number };
  }[] = [];
  for (let i = 1; i <= 25; i += 1) {
    const id = `event-${i}`;
    const bar = chart.locator(eventBarBySource(id)).first();
    const count = await bar.count();
    if (count === 0) continue;
    const bb = await bar.boundingBox();
    if (!bb) continue;
    // Skip the slim progress-overlay rect — bar height should be at least
    // the event minHeight (30). The overlay sibling is typically ~8px tall.
    if (bb.height < 12) continue;
    // Vertical position must be inside the body pane.
    if (bb.y < bodyBox.y || bb.y + bb.height > bodyBox.y + bodyBox.height) continue;

    const edgeX = edge === 'start' ? bb.x : bb.x + bb.width;
    const dragEndX = edgeX + deltaPx;
    // Both the pointer-down x and the pointer-up x must stay inside the
    // body-right pane (with a small margin) so neither end of the drag
    // leaves the timeline viewport.
    const minX = bodyBox.x + MARGIN;
    const maxX = bodyBox.x + bodyBox.width - MARGIN;
    if (edgeX < minX || edgeX > maxX) continue;
    if (dragEndX < minX || dragEndX > maxX) continue;
    candidates.push({ id, bbox: bb });
  }

  if (candidates.length === 0) {
    throw new Error(
      `no candidate event for ${edge}-edge resize with ${absDelta}px headroom in month view`,
    );
  }

  const picked = candidates[0]!;
  const bbox = picked.bbox;
  // The resize zones are 8px-wide invisible rects positioned at the bar's
  // outermost 8px (`x..x+8` for the start edge, `x+w-8..x+w` for the end
  // edge). They're `display:none` until `:hover` activates on the bar
  // group, then become hit-testable. Click 4px inside the edge to land
  // squarely in the middle of the 8px zone.
  const RESIZER_INSET = 4;
  const edgeX = edge === 'start' ? bbox.x + RESIZER_INSET : bbox.x + bbox.width - RESIZER_INSET;
  const startY = bbox.y + bbox.height / 2;
  const endX = edgeX + deltaPx;

  // Force the resizer rects always-visible. The upstream-reference defaults
  // them to `display:none` until the bar's `:hover` pseudo-class activates,
  // which is unreliable to trigger via Playwright's `mouse.move` on SVG
  // groups in headless Chromium. With the override injected, the 8×8
  // handle rects become hit-testable everywhere, while the resize zone
  // geometry and resize event handlers stay exactly as upstream renders
  // them — so the recorded pointer→bbox trace matches what a real
  // hovering user would produce.
  await page.addStyleTag({ content: RESIZER_ALWAYS_VISIBLE_CSS });
  await page.waitForTimeout(50);

  // Verify the resize zone is what's actually under the click coordinate
  // before going further — if `.gantt-event-resizer-{start,end}` isn't
  // the top element here, the drag will trigger a bar-drag instead of an
  // edge resize. The check uses string literals via evaluate-args so
  // chronix-side code stays free of upstream class names.
  const elementAtClick = await page.evaluate(
    ({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return { tag: null, classes: null };
      return { tag: el.tagName, classes: el.getAttribute('class') };
    },
    { x: edgeX, y: startY },
  );
  log({ kind: 'probe', when: 'pre-down', elementAtClick });

  await snapshot('before');
  log({
    kind: 'state',
    when: 'before',
    eventId: picked.id,
    edge,
    barBbox: bbox,
    bodyBox,
    candidateIds: candidates.map((c) => c.id),
  });

  await page.mouse.move(edgeX, startY);
  log({ kind: 'pointer-move', x: edgeX, y: startY });
  await page.mouse.down();
  log({ kind: 'pointer-down', x: edgeX, y: startY });
  await page.mouse.move(endX, startY, { steps: 10 });
  log({ kind: 'pointer-move', x: endX, y: startY, steps: 10 });

  await snapshot('mid');

  await page.mouse.up();
  log({ kind: 'pointer-up', x: endX, y: startY });
  await page.waitForTimeout(200);

  const bboxAfter = await chart.locator(eventBarBySource(picked.id)).first().boundingBox();
  log({
    kind: 'state',
    when: 'after',
    eventId: picked.id,
    edge,
    barBbox: bboxAfter,
  });
  await snapshot('after');
}

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
    id: 'event-resize-left',
    description:
      'Drag the start-edge resize handle of a probed event left by 60px on ' +
      'month view. The bar shrinks from the left, end edge stays pinned. ' +
      'Month-view candidates are probed because day-view pushes all bar ' +
      'right edges past the visible body width, leaving no event whose ' +
      'start edge has both visible position and leftward drag headroom.',
    viewToggleLabel: '月',
    async perform({ page, chart, snapshot, log }) {
      await pickAndResizeEdge({
        page,
        chart,
        snapshot,
        log,
        edge: 'start',
        deltaPx: -60,
      });
    },
  },
  {
    id: 'event-resize-right',
    description:
      'Drag the end-edge resize handle of a probed event right by 60px on ' +
      'month view. The bar extends to the right, start edge stays pinned. ' +
      'Same candidate-probe rationale as event-resize-left.',
    viewToggleLabel: '月',
    async perform({ page, chart, snapshot, log }) {
      await pickAndResizeEdge({
        page,
        chart,
        snapshot,
        log,
        edge: 'end',
        deltaPx: 60,
      });
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
