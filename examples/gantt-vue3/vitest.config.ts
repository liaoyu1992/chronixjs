import { defineConfig } from 'vitest/config';

/**
 * Phase 20.6: the demo package needs happy-dom for the
 * `demo-config.test.ts` unit tests that drive `window.location` +
 * `history.replaceState` to verify the URL-query persistence
 * layer. Otherwise the package has no in-process tests (the
 * demo is exercised end-to-end via the golden-runner package's
 * Playwright suites).
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
