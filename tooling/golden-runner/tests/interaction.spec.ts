import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test } from '@playwright/test';

import { CHART_SELECTOR, FROZEN_TIME_ISO } from '../src/config.js';
import { INTERACTION_RECORDINGS } from '../src/recordings.js';

import type { Page } from '@playwright/test';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RECORDINGS_ROOT = join(PKG_ROOT, 'recordings');

const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );

test.describe('chronix gantt parity recordings (k-ui demo)', () => {
  for (const recording of INTERACTION_RECORDINGS) {
    test(recording.id, async ({ page }) => {
      const outDir = join(RECORDINGS_ROOT, recording.id);
      await mkdir(outDir, { recursive: true });

      await page.clock.install({ time: new Date(FROZEN_TIME_ISO) });
      await page.goto('/');

      const chart = page.locator(CHART_SELECTOR);
      await chart.waitFor({ state: 'visible' });
      await page.waitForLoadState('networkidle');
      await settle(page);

      if (recording.viewToggleLabel) {
        await chart.getByRole('button', { name: recording.viewToggleLabel, exact: true }).click();
        await settle(page);
      }

      const entries: Record<string, unknown>[] = [];

      await recording.perform({
        page,
        chart,
        async snapshot(keyframeId) {
          const buffer = await chart.screenshot();
          await writeFile(join(outDir, `${keyframeId}.png`), buffer);
          entries.push({ kind: 'snapshot', keyframeId });
        },
        log(entry) {
          entries.push(entry);
        },
      });

      const payload = {
        id: recording.id,
        description: recording.description,
        viewToggleLabel: recording.viewToggleLabel ?? null,
        frozenTime: FROZEN_TIME_ISO,
        entries,
      };
      await writeFile(join(outDir, 'log.json'), `${JSON.stringify(payload, null, 2)}\n`);
    });
  }
});
