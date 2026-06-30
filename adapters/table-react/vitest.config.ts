import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // CI-friendly timeout: server-side anticipatory
    // prefetch tests await network-like delays + scroll-driven
    // viewport recomputation; 5000ms default is fine locally but
    // ubuntu-runner is consistently slower (timed out × 3 retries
    // on CI run #26795051394). 15s gives headroom without
    // masking real hangs.
    testTimeout: 15000,
  },
});
