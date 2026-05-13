import type { PointerCaptureConfig } from '../interaction/index.js';

/**
 * Anti-regression hook #2 made concrete. A `PointerOverlayGroup` is a
 * render-tree container that re-enables hit-testing inside an otherwise
 * pointer-events:none parent — needed when a render-side concern (separate
 * paint layer, z-stacked widget) demands its own hit zone.
 *
 * IR-side: `BarSpec.pointerOverlayId` is a free-form id; bars with the
 * same id belong to the same group. Adapters group them at render time
 * and apply this group's `pointerCapture` config to the resulting layer.
 */
export interface PointerOverlayGroup {
  readonly id: string;
  /** Hit-test config applied to any pointer subject inside this group. */
  readonly pointerCapture: PointerCaptureConfig;
}
