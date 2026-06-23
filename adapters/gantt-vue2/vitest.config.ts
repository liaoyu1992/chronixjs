import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    // CI-friendly timeout: Vitest 2→4 upgrade, some tests timeout on CI
    // due to slower ubuntu-runner performance. 15s gives headroom.
    testTimeout: 15000,
  },
});
