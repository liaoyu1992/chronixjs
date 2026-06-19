import type {
  LinkRouterInput,
  LinkRouterOutput,
  PlacedBar,
  RoutedLink,
  RoutedLinkMarker,
} from './types.js';

/**
 * Phase 2 layout pass #4. Computes SVG path strings + marker positions
 * for dependency lines between placed bars.
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
 * original demo doesn't exercise.
 *
 * The marker only carries position + angle — the SHAPE comes from
 * `LinkSpec.marker` and is resolved by the render layer. This keeps
 * routing free of marker-rendering concerns and lets the same routed
 * path serve any marker style.
 */
export interface LinkRouter {
  route(input: LinkRouterInput): LinkRouterOutput;
}

/**
 * Phase 2 layout pass #4. Computes SVG path strings + marker positions
 * for dependency lines between placed bars.
 *
 * Two routings are supported. `'square'` emits a 3-segment orthogonal
 * polyline from the predecessor's right edge to the successor's left
 * edge. `'smooth'` emits a cubic Bézier curve into a pre-target landing
 * point + a short horizontal `L` segment so the marker still enters
 * the target horizontally.
 *
 * Features:
 * - Complete backward smooth routing (C+S compound curves)
 * - Full square routing with same-row left-target avoidance
 * - Auto-adaptive behavior based on position relationships
 * - Configurable vertical offset for obstacle avoidance
 *
 * The marker only carries position + angle — the SHAPE comes from
 * `LinkSpec.marker` and is resolved by the render layer.
 */

interface Point {
  x: number;
  y: number;
  type: 'M' | 'L' | 'Q' | 'T' | 'C' | 'S' | '';
}

interface DependencyLineInternal {
  topOffset: number;
  leftOffset: number;
  type: 'square' | 'smooth';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  points: Point[];
  extraVerticalOffset?: number;
  forceVerticalDown?: boolean;
}

/**
 * Dependency line algorithm class
 */
class DependencyLineAlgorithm {
  private options: { type: 'square' | 'smooth'; smoothBeforeTargetGapPx: number };

  constructor(type: 'square' | 'smooth' = 'square', smoothBeforeTargetGapPx = 20) {
    this.options = { type, smoothBeforeTargetGapPx };
  }

  /**
   * Generate square path points (orthogonal routing)
   */
  private setSquarePoints(line: DependencyLineInternal): void {
    const { topOffset, leftOffset, fromX, fromY, toX, toY } = line;

    // Start point
    line.points.push({
      x: fromX + leftOffset,
      y: fromY + topOffset,
      type: 'M',
    });

    // Check if same row
    if (fromY === toY) {
      const targetOnLeft = toX < fromX;
      if (!targetOnLeft) {
        // Same row, target on right: direct horizontal connection
        line.points.push({
          x: toX - leftOffset,
          y: toY + topOffset,
          type: 'L',
        });
        return;
      }

      // Same row but target on left: need to avoid the source bar
      const beforeTargetX = toX - this.options.smoothBeforeTargetGapPx;
      const baseVerticalOffset = line.extraVerticalOffset ?? 0;
      const verticalClearance = Math.max(16, baseVerticalOffset);
      const goDown = line.forceVerticalDown !== false;
      const verticalDirection = goDown ? 1 : -1;
      const verticalAnchorY = fromY + topOffset + verticalDirection * verticalClearance;

      line.points.push({ x: fromX + leftOffset, y: verticalAnchorY, type: 'L' });
      line.points.push({ x: beforeTargetX, y: verticalAnchorY, type: 'L' });
      line.points.push({ x: beforeTargetX, y: toY + topOffset, type: 'L' });
      line.points.push({ x: toX - leftOffset, y: toY + topOffset, type: 'L' });
      return;
    }

    // Define the turn point before target (smoothBeforeTargetGapPx left of target)
    const beforeTargetX = toX - this.options.smoothBeforeTargetGapPx;

    // Not on same row, need routing
    if (toX < fromX) {
      // ========== Target on left ==========
      // Path: right → down/up → left → reach target row → horizontal enter

      // Step 1: move right a small distance
      line.points.push({
        x: fromX + leftOffset + 10,
        y: fromY + topOffset,
        type: 'L',
      });

      const forceVerticalDown = !!line.forceVerticalDown;
      const goDownFirst = toY > fromY || forceVerticalDown;

      if (goDownFirst) {
        // --- Target on left-bottom ---
        // Path: right->down->left->down
        const extraOffset = line.extraVerticalOffset || 0;
        const secondSegmentY = fromY + topOffset + 20 + extraOffset;

        line.points.push({ x: fromX + leftOffset + 10, y: secondSegmentY, type: 'L' });
        line.points.push({ x: beforeTargetX, y: secondSegmentY, type: 'L' });
        line.points.push({ x: beforeTargetX, y: toY + topOffset, type: 'L' });
      } else {
        // --- Target on left-top ---
        // Path: right->up->left->down
        const extraOffset = line.extraVerticalOffset || 0;
        const secondSegmentY = fromY - 20 - extraOffset;

        line.points.push({ x: fromX + leftOffset + 10, y: secondSegmentY, type: 'L' });
        line.points.push({ x: beforeTargetX, y: secondSegmentY, type: 'L' });
        line.points.push({ x: beforeTargetX, y: toY + topOffset, type: 'L' });
      }

      // Finally: horizontal enter from left edge
      line.points.push({
        x: toX - leftOffset,
        y: toY + topOffset,
        type: 'L',
      });
    } else {
      // ========== Target on right ==========
      // Path: horizontal → vertical to target row → horizontal enter

      // Step 1: horizontal to before-target turn point
      line.points.push({
        x: beforeTargetX,
        y: fromY + topOffset,
        type: 'L',
      });

      // Step 2: vertical to target row
      line.points.push({
        x: beforeTargetX,
        y: toY + topOffset,
        type: 'L',
      });

      // Finally: horizontal enter
      line.points.push({
        x: toX - leftOffset,
        y: toY + topOffset,
        type: 'L',
      });
    }
  }

  /**
   * Generate smooth curve path points (Bézier curves)
   */
  private setSmoothPoints(line: DependencyLineInternal): void {
    const { topOffset, leftOffset, fromX, fromY, toX, toY } = line;

    // Start point
    line.points.push({
      x: fromX + leftOffset,
      y: fromY + topOffset,
      type: 'M',
    });

    // Check if same row
    if (fromY === toY) {
      if (toX < fromX) {
        // Same row, target on left: keep square avoidance strategy
        const beforeTargetX = toX - this.options.smoothBeforeTargetGapPx;
        const baseVerticalOffset = line.extraVerticalOffset ?? 0;
        const verticalClearance = Math.max(16, baseVerticalOffset);
        const goDown = line.forceVerticalDown !== false;
        const verticalDirection = goDown ? 1 : -1;
        const verticalAnchorY = fromY + topOffset + verticalDirection * verticalClearance;

        line.points.push({ x: fromX + leftOffset, y: verticalAnchorY, type: 'C' });
        line.points.push({ x: (fromX + beforeTargetX) / 2, y: verticalAnchorY, type: '' });
        line.points.push({ x: beforeTargetX, y: verticalAnchorY, type: '' });
        line.points.push({ x: toX - leftOffset, y: toY + topOffset, type: 'L' });
        return;
      }

      // Same row, target on right: simplify to straight line (performance)
      line.points.push({
        x: toX - leftOffset,
        y: toY + topOffset,
        type: 'L',
      });
      return;
    }

    // Define turn point before target (smoothBeforeTargetGapPx left of target)
    const beforeTargetX = toX - this.options.smoothBeforeTargetGapPx;
    const horizontalDistance = (toX - fromX) / 2;
    const midX = fromX + horizontalDistance;

    if (fromX <= toX) {
      // ========== Target on right (simple case) ==========
      // Use Bézier curve to pre-target point, then horizontal enter

      // Cubic Bézier to pre-target turn point
      line.points.push({ x: midX, y: fromY + topOffset, type: 'C' });
      line.points.push({ x: beforeTargetX - 10, y: toY + topOffset, type: '' });
      line.points.push({ x: beforeTargetX, y: toY + topOffset, type: '' });

      // Horizontal segment to target
      line.points.push({ x: toX - leftOffset, y: toY + topOffset, type: 'L' });
    } else {
      // ========== Target on left (complex case) ==========
      // Need to bypass source, then horizontal enter
      // Path: M start → C curve right → S curve left to pre-target → L horizontal enter

      const verticalDistance = (toY - fromY) / 2;
      const midY = fromY + verticalDistance + topOffset;

      // First Bézier: curve right
      line.points.push({ x: fromX + 20, y: fromY + topOffset, type: 'C' });
      line.points.push({ x: fromX + 40, y: midY, type: '' });
      line.points.push({ x: midX, y: midY, type: '' });

      // Second Bézier: curve left to pre-target
      line.points.push({ x: beforeTargetX - 10, y: toY + topOffset, type: 'S' });
      line.points.push({ x: beforeTargetX, y: toY + topOffset, type: '' });

      // Horizontal to target
      line.points.push({ x: toX - leftOffset, y: toY + topOffset, type: 'L' });
    }
  }

  /**
   * Set path points (calls appropriate algorithm based on type)
   */
  setPoints(line: DependencyLineInternal): void {
    switch (line.type) {
      case 'square':
        this.setSquarePoints(line);
        break;
      case 'smooth':
        this.setSmoothPoints(line);
        break;
      default:
        this.setSquarePoints(line);
        break;
    }
  }

  /**
   * Generate SVG path string from points array
   */
  generateSVGPath(line: DependencyLineInternal): string {
    if (!line.points.length) return '';

    const points = line.points.slice();
    const firstPoint = points.shift()!;
    let path = `${firstPoint.type} ${firstPoint.x} ${firstPoint.y}`;

    if (points.length) {
      path +=
        ' ' +
        points
          .map((point) => {
            if (point.type === '') {
              // Empty type means continuation of previous command (C/S), just emit coordinates
              return `${point.x} ${point.y}`;
            }
            return `${point.type} ${point.x} ${point.y}`;
          })
          .join(' ');
    }

    return path;
  }

  /**
   * Generate dependency line (main entry point)
   */
  generateDependencyLine(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): DependencyLineInternal {
    const line: DependencyLineInternal = {
      topOffset: 0,
      leftOffset: 0,
      points: [],
      type: this.options.type,
      fromX,
      fromY,
      toX,
      toY,
    };

    this.setPoints(line);
    return line;
  }
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

export const defaultLinkRouter: LinkRouter = {
  route(input) {
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

      // Create algorithm instance with the link's routing type and smooth gap
      const algorithm = new DependencyLineAlgorithm(link.routing, smoothGap);
      const line = algorithm.generateDependencyLine(from.x, from.y, to.x, to.y);

      // Marker enters the target horizontally on its left edge
      const marker: RoutedLinkMarker = { x: to.x, y: to.y, angleDeg: 0 };

      routedLinks.push({
        linkId: link.id,
        pathD: algorithm.generateSVGPath(line),
        marker,
        ...(link.colorOverride !== undefined ? { color: link.colorOverride } : {}),
      });
    }

    return { routedLinks, orphanLinkIds };
  },
};
