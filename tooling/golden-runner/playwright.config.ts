import { defineConfig, devices } from '@playwright/test';

import { DEMO_URL, VIEWPORT } from './src/config.js';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  snapshotDir: './goldens',
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL: DEMO_URL,
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    timezoneId: 'Asia/Shanghai',
    locale: 'zh-CN',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT },
    },
  ],
});
