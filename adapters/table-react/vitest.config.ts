import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // CI-friendly timeout: server-side block-dispatch tests
    // (45.3/45.5) resolve a 1000-row bootstrap + scroll-driven
    // viewport recomputation. The 5s default is fine locally, but
    // the ubuntu runner is slower and the react adapter's
    // act()/reconciler overhead pushes 45.3 to ~15-18s on Node 20
    // (vue2/vue3 equivalents finish in ~7.5s); 15s timed out x3
    // retries on CI (run #30966977028). 30s gives headroom without
    // masking real hangs.
    testTimeout: 30000,
  },
});
