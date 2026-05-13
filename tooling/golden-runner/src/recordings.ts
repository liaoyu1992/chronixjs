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
];
