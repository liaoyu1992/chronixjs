import { CHART_ROOT } from './reference-dom-map.js';

export const DEMO_URL = process.env['CHRONIX_DEMO_URL'] ?? 'http://localhost:8701/';

export const FROZEN_TIME_ISO = '2026-05-13T00:00:00.000Z';

export const VIEWPORT = { width: 1440, height: 900 } as const;

/**
 * Selector for the chart root in the parity oracle's DOM. Re-exported
 * from `reference-dom-map` so existing callers keep working; new code
 * should import directly from the map.
 */
export const CHART_SELECTOR = CHART_ROOT;
