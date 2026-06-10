import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

/**
 * chronix-ui vue3 demo — Phase 10 (2026-06-02).
 *
 * Port 8731 is the chronix-ui vue3 demo port per UI_MIGRATION_PLAN.md.
 * Phase 12 will add vue2 (8732) + react (8733) demos; cross-adapter
 * parity Playwright specs in `tooling/golden-runner/tests/` drive all
 * three demos in lockstep.
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8731,
    strictPort: true,
  },
});
