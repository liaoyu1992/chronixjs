/**
 * chronix-ui spin module — .
 *
 * Core IR for the Spin component. Adapter components consume these
 * types + pure helpers to render framework-specific spinner elements
 * with identical class structure.
 */

export type { SpinProps, SpinSize } from './spin-spec.js';
export { defaultSpinProps } from './spin-spec.js';
export { resolveSpinClassList } from './resolve-spin-class-list.js';
export { CHRONIX_SPIN_CSS, ensureChronixSpinStyles } from './spin-styles.js';
