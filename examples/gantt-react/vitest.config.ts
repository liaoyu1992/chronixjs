import { defineConfig } from 'vitest/config';

/**
 * Phase 46: the react demo needs happy-dom for the
 * `demo-config.test.ts` unit tests covering the URL-query
 * persistence layer (mirrors `examples/gantt-vue3/vitest.config.ts`).
 * Tests target the framework-agnostic field-factory layer
 * (`bool` / `str` / `num` / `enumOf` / `describeConfigSchema`) plus
 * the hook's URL round-trip behavior driven via direct invocation
 * (no `renderHook` dependency required).
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
