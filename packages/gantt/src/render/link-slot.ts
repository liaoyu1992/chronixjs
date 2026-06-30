import type { ChronixTheme } from '../api/chronix-theme.js';
import type { CustomLinkMarker, LinkMarker, LinkSpec } from '../ir/index.js';
import type { PlacedBar, RoutedLink } from '../layout/types.js';

/**
 * Args bag passed as `SlotContext.args` when the `'link'` slot fires
 * (chronix-additive parallel 's `'bar'`
 * slot). Each routed link gets one invocation per render pass; the
 * template's return is the framework's VNode shape for the entire
 * link's rendered output. The default `<path class="cx-gantt-link">`
 * is replaced entirely when a template is registered.
 *
 * Geometry comes pre-resolved on `routedLink` (`pathD` + marker
 * position). `fromBar` / `toBar` are the resolved endpoints — the
 * template can read bar geometry / metadata directly without
 * separately mapping ids back to placed bars.
 *
 * `color` and `marker` reflect the LAYERED resolution: spec's
 * `colorOverride`, the `useLineEventColor` source-bar lookup, and the
 * `onLineCallback` override have all already applied. A consumer
 * template that just wants to retain the chronix defaults can pass
 * these directly into its own `<path>` + marker-end ref.
 *
 * `theme` is the adapter's effective merged theme (`{...defaults,
 * ...props.theme}`). Slot consumers consult it for stroke widths /
 * colors so visual choices stay coordinated with the rest of the
 * chart's chrome.
 */
export interface LinkSlotArgs {
  readonly routedLink: RoutedLink;
  readonly linkSpec: LinkSpec;
  readonly fromBar: PlacedBar;
  readonly toBar: PlacedBar;
  readonly color: string;
  readonly marker: LinkMarker | CustomLinkMarker;
  readonly theme: ChronixTheme;
}

/**
 * Slot name chronix's adapter consults for per-link rendering.
 * Exposed as a constant so consumers don't have to remember the
 * literal string and the adapter can rename it in a future phase
 * without breaking caller code. Parallel to `BAR_SLOT_NAME` from
 * .
 */
export const LINK_SLOT_NAME = 'link';
