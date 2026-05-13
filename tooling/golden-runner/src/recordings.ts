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

      const triangles = chart.locator('.gantt-event-progress-drag-triangle');
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
        throw new Error(`no in-viewport progress triangle with drag headroom (${total} total in DOM)`);
      }

      const instanceId = await triangle.getAttribute('data-instance-id');

      // The event bar above this triangle owns the progress text label. Snapshot
      // its text content before/after so chronix can be checked against the same
      // mutation, not just pixels.
      const eventBar = chart.locator(`[data-instance-id="${instanceId}"]`).first();
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
];
