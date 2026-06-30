import type { CustomLinkMarker, LinkMarker, LinkSpec } from '../ir/index.js';
import type { PlacedBar, RoutedLink } from '../layout/types.js';

/**
 * Argument bag passed to `onLineCallback` . Chronix-
 * native shape; carries the routed geometry plus the resolved
 * defaults the callback would render with if it returned
 * `undefined`. Mirror of the original `DependencyLine`
 * shape — render-time fields only (the route was already computed by
 * `LinkRouter`; the callback in this scope can only override how the
 * route is PRESENTED, not the route itself).
 *
 * - `defaultColor`: the line stroke color BEFORE the callback runs.
 *   This already reflects `LinkSpec.colorOverride` and the
 *   `useLineEventColor` prop's source-bar lookup; the callback
 *   typically only overrides when it has a per-link signal more
 *   specific than either.
 * - `currentMarker`: the marker shape the link would render with
 *   absent the callback (= `LinkSpec.marker`).
 * - `fromBar` / `toBar`: the resolved `PlacedBar`s the link
 *   connects. `RoutedLink` only carries the link's id + path
 *   geometry, so the callback gets the bar references separately for
 *   convenience (per-bar metadata lookups, source-bar-color reads,
 *   etc).
 */
export interface LinkRenderArg {
  readonly routedLink: RoutedLink;
  readonly linkSpec: LinkSpec;
  readonly fromBar: PlacedBar;
  readonly toBar: PlacedBar;
  readonly defaultColor: string;
  readonly currentMarker: LinkMarker | CustomLinkMarker;
}

/**
 * Partial override returned by `onLineCallback`. Each field replaces
 * the corresponding default when present; omitted fields fall
 * through. v0 scope: color + marker only. The original spec's
 * callback can additionally mutate `routing` ('square' / 'smooth')
 * and `extraVerticalOffset`; both require re-running the layout
 * pass, which is out of single-session scope here. Re-prioritize
 * when a consumer asks for runtime routing-type switching.
 */
export interface LinkRenderOverride {
  readonly color?: string;
  readonly marker?: LinkMarker | CustomLinkMarker;
}

/**
 * Per-link render callback . One callback registered per
 * chart via the `onLineCallback` component prop; consumers chaining
 * rules call multiple helpers inside one function (the parity
 * reference accepts an array, but chronix v0 prefers a single
 * function — re-prioritize on consumer ask).
 *
 * Returns `undefined` (or omits any field) to accept the default
 * cascade. Returning an object with a field set overrides that
 * channel; omitted channels still pass through.
 */
export type LinkRenderFunc = (arg: LinkRenderArg) => LinkRenderOverride | undefined;
