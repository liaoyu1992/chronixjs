import type {
  LinkRouterInput,
  LinkRouterOutput,
  PlacedBar,
  RoutedLink,
  RoutedLinkMarker,
} from './types.js';

/**
 * Phase 2 layout pass #4. The hardest pass. Computes SVG path strings
 * + marker positions for dependency lines between placed bars.
 *
 * v0 implements `'square'` routing only — 3-segment orthogonal polyline
 * from the predecessor's right edge to the successor's left edge with a
 * configurable horizontal nub before the vertical turn. `'smooth'`
 * (curved) routing throws "not yet implemented" until the cubic-bezier
 * variant lands; same staging pattern AxisRangePlanner used for views.
 *
 * The marker only carries position + angle — the SHAPE comes from
 * `LinkSpec.marker` and is resolved by the render layer. This keeps
 * routing free of marker-rendering concerns and lets the same routed
 * path serve any marker style.
 */
export interface LinkRouter {
  route(input: LinkRouterInput): LinkRouterOutput;
}

interface Anchor {
  readonly x: number;
  readonly y: number;
}

function predecessorAnchor(bar: PlacedBar): Anchor {
  return { x: bar.x + bar.width, y: bar.y + bar.height / 2 };
}

function successorAnchor(bar: PlacedBar): Anchor {
  return { x: bar.x, y: bar.y + bar.height / 2 };
}

/** 3-segment elbow: M(from) → horizontal nub → vertical → horizontal to(to). */
function routeSquarePath(from: Anchor, to: Anchor, nub: number): string {
  const midX = from.x + nub;
  return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
}

export const defaultLinkRouter: LinkRouter = {
  route(input) {
    const nub = input.elbowNubPx ?? 12;
    const barById = new Map(input.placedBars.map((p) => [p.barId, p]));

    const routedLinks: RoutedLink[] = [];
    const orphanLinkIds: string[] = [];

    for (const link of input.links) {
      const fromBar = barById.get(link.fromBarId);
      const toBar = barById.get(link.toBarId);
      if (!fromBar || !toBar) {
        orphanLinkIds.push(link.id);
        continue;
      }

      const from = predecessorAnchor(fromBar);
      const to = successorAnchor(toBar);

      let pathD: string;
      if (link.routing === 'square') {
        pathD = routeSquarePath(from, to, nub);
      } else {
        throw new Error(`LinkRouter: routing '${link.routing}' not yet implemented`);
      }

      // Marker enters the target horizontally on its left edge — last
      // path segment is the M-to-L from (midX, to.y) → (to.x, to.y), so
      // the marker points right (0°).
      const marker: RoutedLinkMarker = { x: to.x, y: to.y, angleDeg: 0 };

      routedLinks.push({
        linkId: link.id,
        pathD,
        marker,
        ...(link.colorOverride !== undefined ? { color: link.colorOverride } : {}),
      });
    }

    return { routedLinks, orphanLinkIds };
  },
};
