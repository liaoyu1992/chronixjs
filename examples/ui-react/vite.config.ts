import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * chronix-ui react demo — Phase 12 (2026-06-02).
 *
 * Port 8733 per UI_MIGRATION_PLAN.md (vue3=8731 / vue2=8732 / react=8733).
 * Cross-adapter parity Playwright in
 * `tooling/golden-runner/tests/ui-button-parity.spec.ts` drives all
 * three demos in lockstep.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8733,
    strictPort: true,
  },
});
