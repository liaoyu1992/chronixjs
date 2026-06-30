/**
 * chronix-ui countdown module — .
 *
 * Public surface: pure data + pure helpers. Adapter packages own the
 * `setInterval` lifecycle per Decision D.1.
 */

export type { CountdownPrecision, CountdownProps } from './countdown-spec.js';
export { defaultCountdownProps } from './countdown-spec.js';
export { resolveCountdownClassList } from './resolve-countdown-class-list.js';
export { formatCountdownDuration } from './format-countdown-duration.js';
export { computeCountdownTickIntervalMs } from './compute-countdown-tick-interval-ms.js';
export { CHRONIX_COUNTDOWN_CSS, ensureChronixCountdownStyles } from './countdown-styles.js';
