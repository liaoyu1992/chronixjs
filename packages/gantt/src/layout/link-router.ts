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
 * Two routings are supported. `'square'` emits a 3-segment orthogonal
 * polyline from the predecessor's right edge to the successor's left
 * edge with a configurable horizontal nub before the vertical turn.
 * `'smooth'` emits a cubic Bézier curve into a pre-target landing
 * point + a short horizontal `L` segment so the marker still enters
 * the target horizontally.
 *
 * Smooth routing is FORWARD-ONLY (target's x ≥ source's x). Same-row
 * forward emits a straight `L` (no curve needed — matches the
 * reference's performance optimization). Cross-row forward emits the
 * cubic-Bézier variant. Backward smooth routing throws — the parked
 * variant exists for circular/manual dependency overrides the
 * reference demo doesn't exercise.
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

/**
 * Smooth routing for FORWARD links (`to.x ≥ from.x`).
 *
 * Same-row case collapses to a straight `M`+`L` line. Cross-row case
 * emits a cubic Bézier with control points at `(midX, from.y)` and
 * `(beforeTargetX - 10, to.y)`, landing at `(beforeTargetX, to.y)`,
 * followed by a short horizontal `L` so the marker enters the target
 * cleanly. Control-point formula mirrors the reference's
 * `setSmoothPoints` algorithm verbatim — empirically tuned for the
 * gantt-typical case where bars are tens-to-thousands of pixels
 * apart and the curve needs to enter horizontal at both ends.
 *
 * Caller has already filtered the backward case (`to.x < from.x`) —
 * this function assumes forward direction.
 */
function routeSmoothPath(from: Anchor, to: Anchor, beforeTargetGap: number): string {
  if (from.y === to.y) {
    // Same-row forward — straight line, no curve. Matches the
    // reference's performance-optimized branch.
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }
  const midX = (from.x + to.x) / 2;
  const beforeTargetX = to.x - beforeTargetGap;
  // Cubic Bézier: control1 = (midX, from.y), control2 = (beforeTargetX - 10, to.y),
  // endpoint = (beforeTargetX, to.y). Followed by horizontal `L` to target.
  return (
    `M ${from.x} ${from.y}` +
    ` C ${midX} ${from.y} ${beforeTargetX - 10} ${to.y} ${beforeTargetX} ${to.y}` +
    ` L ${to.x} ${to.y}`
  );
}

export const defaultLinkRouter: LinkRouter = {
  route(input) {
    const nub = input.elbowNubPx ?? 12;
    const smoothGap = input.smoothBeforeTargetGapPx ?? 20;
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
      } else if (link.routing === 'smooth') {
        if (to.x < from.x) {
          // Backward smooth routing (reference's branches 2 + 4) needs
          // a compound C+S detour the chronix demo doesn't exercise.
          // Parked with explicit failure so a consumer who hits this
          // case gets a clear pointer instead of a silent miscalculation.
          throw new Error(
            `LinkRouter: 'smooth' routing for backward links not yet implemented (link ${link.id})`,
          );
        }
        pathD = routeSmoothPath(from, to, smoothGap);
      } else {
        // Exhaustiveness check — if `LinkRouting` gains a third variant,
        // this assignment fails at compile-time and the throw catches
        // any runtime widening.
        const _exhaustive: never = link.routing;
        throw new Error(`LinkRouter: routing '${String(_exhaustive)}' not yet implemented`);
      }

      // Marker enters the target horizontally on its left edge. Both
      // routings end with an `L` segment from `(prevX, to.y)` to
      // `(to.x, to.y)`, so the marker always points right (0°).
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
