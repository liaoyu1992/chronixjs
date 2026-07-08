import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // server-side prefetch tests await network-like delays; mirror the
    // adapter suites' CI-friendly timeout budget.
    testTimeout: 15000,
  },
});
