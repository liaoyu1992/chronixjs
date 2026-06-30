import { defineConfig } from 'vitest/config';

/**
 * the vue2 demo currently has no in-process tests. Vitest is
 * wired so the package matches the workspace test-script contract;
 * `--passWithNoTests` in package.json keeps the run green until a
 * `src/*.test.ts` lands.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
});
