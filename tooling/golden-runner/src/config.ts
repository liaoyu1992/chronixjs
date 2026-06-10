import { CHART_ROOT } from './reference-dom-map.js';

export const DEMO_URL = process.env['CHRONIX_DEMO_URL'] ?? 'http://localhost:8701/';

export const FROZEN_TIME_ISO = '2026-05-13T00:00:00.000Z';

export const VIEWPORT = { width: 1440, height: 900 } as const;

/**
 * Selector for the chart root in the the original spec's DOM. Re-exported
 * from `reference-dom-map` so existing callers keep working; new code
 * should import directly from the map.
 */
export const CHART_SELECTOR = CHART_ROOT;

/**
 * Phase 0 (2026-05-23) — chronix-table cross-demo parity URLs.
 *
 * chronix-table demo ports: 8711 (vue3) / 8712 (vue2) / 8713 (react).
 * reference-table demo ports: 8721 (vue3) / 8722 (vue2) / 8723 (react).
 *
 * Each cross-demo Playwright spec resolves both sides via env vars,
 * defaulting to the ports above. Mirrors the chronix-gantt pattern
 * (`CHRONIX_VUE3_DEMO_URL` etc.).
 */
export const CHRONIX_TABLE_VUE3_DEMO_URL =
  process.env['CHRONIX_TABLE_VUE3_DEMO_URL'] ?? 'http://localhost:8711/';
export const CHRONIX_TABLE_VUE2_DEMO_URL =
  process.env['CHRONIX_TABLE_VUE2_DEMO_URL'] ?? 'http://localhost:8712/';
export const CHRONIX_TABLE_REACT_DEMO_URL =
  process.env['CHRONIX_TABLE_REACT_DEMO_URL'] ?? 'http://localhost:8713/';

export const REFERENCE_TABLE_VUE3_DEMO_URL =
  process.env['REFERENCE_TABLE_VUE3_DEMO_URL'] ?? 'http://localhost:8721/';
export const REFERENCE_TABLE_VUE2_DEMO_URL =
  process.env['REFERENCE_TABLE_VUE2_DEMO_URL'] ?? 'http://localhost:8722/';
export const REFERENCE_TABLE_REACT_DEMO_URL =
  process.env['REFERENCE_TABLE_REACT_DEMO_URL'] ?? 'http://localhost:8723/';

/**
 * Phase 10 (2026-06-02) — chronix-ui cross-demo URLs.
 *
 * Per `audit/UI_MIGRATION_PLAN.md` Phase 10:
 *   chronix-ui demo ports: 8731 (vue3) / 8732 (vue2) / 8733 (react).
 *   reference-ui canonical demo port: 8741.
 *
 * Phase 10 ships only the vue3 demo (port 8731) consuming the
 * Phase 11 Button pilot from `@chronixjs/ui-vue3`. Vue2 + React
 * demo apps land in Phase 12 when their adapter packages do; the
 * URL constants are declared now so Phase 12 specs can reference
 * them without re-touching this file.
 */
export const CHRONIX_UI_VUE3_DEMO_URL =
  process.env['CHRONIX_UI_VUE3_DEMO_URL'] ?? 'http://localhost:8731/';
export const CHRONIX_UI_VUE2_DEMO_URL =
  process.env['CHRONIX_UI_VUE2_DEMO_URL'] ?? 'http://localhost:8732/';
export const CHRONIX_UI_REACT_DEMO_URL =
  process.env['CHRONIX_UI_REACT_DEMO_URL'] ?? 'http://localhost:8733/';

export const REFERENCE_UI_DEMO_URL =
  process.env['REFERENCE_UI_DEMO_URL'] ?? 'http://localhost:8741/';
