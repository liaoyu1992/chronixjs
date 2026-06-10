import vue from '@vitejs/plugin-vue2';
import { defineConfig } from 'vite';

/**
 * chronix-ui vue2 demo — Phase 12 (2026-06-02).
 *
 * Port 8732 per UI_MIGRATION_PLAN.md (vue3=8731 / vue2=8732 / react=8733).
 * Cross-adapter parity Playwright in
 * `tooling/golden-runner/tests/ui-button-parity.spec.ts` drives all
 * three demos in lockstep.
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8732,
    strictPort: true,
  },
});
