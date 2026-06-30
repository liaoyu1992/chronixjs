import type { BarSpec, TimeRange } from '../ir/index.js';

/**
 * Validation gates run when a bar drag / resize / range-select commits.
 * Each predicate may veto the commit by returning `false`; the host then
 * sees a `*-rejected` emit (silent revert) and the bar's existing range
 * stays in place. Predicates short-circuit in the order constraint →
 * overlap → allow.
 *
 * Validation is commit-time only in v0 — the in-flight render does NOT
 * reflect validity (no live cursor / bar-color cue). The v1 surface
 * adds a live cue once a render-side rejection path lands.
 */

/**
 * The proposed post-commit state being validated. `range` is the new
 * time range (start, end) and `rowId` is the target row. Both already
 * have snap-to-grid applied — by the time a validator runs, the
 * resolved values are final.
 */
export interface DropProposal {
  readonly range: TimeRange;
  readonly rowId: string;
}

/**
 * `eventAllow` predicate. Returns `true` to permit the commit; `false`
 * aborts the commit. `movingBar` is the bar being dragged or resized
 * (its `.range` / `.rowId` are the PRE-commit values).
 */
export type EventAllowFunc = (proposal: DropProposal, movingBar: BarSpec) => boolean;

/**
 * `selectAllow` predicate for calendar-range-select commits. Same shape
 * as `EventAllowFunc` minus the moving-bar (range-select creates a new
 * range; there's no bar being mutated).
 */
export type SelectAllowFunc = (proposal: DropProposal) => boolean;

/**
 * Per-pair overlap predicate. Called once per `(stillBar, movingBar)`
 * pair whose ranges intersect on DIFFERENT rows. Returns `false` to
 * reject the commit. Same-row overlap is always permitted (the bar-
 * stack layout pass handles same-row stacking visually), matching the
 * reference's same-resource shortcut.
 *
 * **Important — `movingBar` identity** (D.10 clarification):
 * the `movingBar` arg is a SYNTHETIC proposed-state object, not the
 * live bar from `ValidationContext.bars`. It carries the bar's
 * persisted fields (`id` / persisted `style` / etc.) but with `rowId`
 * and `range` overridden to the in-flight drag's proposal. This means:
 *
 * - Field reads (`.id`, `.range`, `.rowId`) see the proposed state.
 * - Identity comparisons fail: `movingBar === ctx.bars.find(b => b.id
 *   === movingBar.id)` returns `false` because `movingBar` is a freshly
 *   spread `{ ...movingBar, rowId, range }` clone.
 *
 * Consumers that want to reach the live bar should look it up by id:
 * `const liveBar = ctx.bars.find(b => b.id === movingBar.id)`.
 */
export type EventOverlapFunc = (stillBar: BarSpec, movingBar: BarSpec) => boolean;

/**
 * Constrains drag / resize / select destinations to a time window
 * and optionally to a row whitelist. The proposed range must satisfy:
 *
 *   - `proposal.range.start >= constraint.range.start`
 *   - `proposal.range.end   <= constraint.range.end`
 *   - if `constraint.rowIds` is set: `proposal.rowId` is in `rowIds`
 */
export interface EventConstraint {
  readonly range: TimeRange;
  readonly rowIds?: readonly string[];
}

/**
 * Why a commit was rejected. Surfaced on `*-rejected` emit payloads so
 * the host can render an explanatory toast / undo dialog without
 * re-running the same predicates itself.
 */
export type RejectionReason = 'constraint' | 'overlap' | 'allow';

/**
 * Bundle of validator props + current chart state passed into each
 * `validate*` call. The bars list excludes the moving bar by id during
 * the overlap check, so the caller can pass the full chart `bars`
 * array without pre-filtering.
 */
export interface ValidationContext {
  readonly bars: readonly BarSpec[];
  readonly eventAllow?: EventAllowFunc;
  readonly selectAllow?: SelectAllowFunc;
  readonly eventOverlap?: boolean | EventOverlapFunc;
  readonly eventConstraint?: EventConstraint;
  /**
   * independent overlap policy for calendar-range-select.
   * Falls back to `eventOverlap` when unset (preserves the v0 "set
   * once, gates both" ergonomic contract). Set to `true` explicitly
   * to opt out of select-side overlap when `eventOverlap === false`
   * is in effect for drag. Function form receives `(stillBar, null)` —
   * range-select has no moving bar, so the second arg is always `null`.
   */
  readonly selectOverlap?: boolean | EventOverlapFunc;
  /**
   * independent constraint window for calendar-range-select.
   * Falls back to `eventConstraint` when unset. Lets a consumer widen
   * the drag window while narrowing the select window (or vice versa)
   * without re-implementing the validator chain.
   */
  readonly selectConstraint?: EventConstraint;
}

function satisfiesConstraint(proposal: DropProposal, c: EventConstraint): boolean {
  if (proposal.range.start.getTime() < c.range.start.getTime()) return false;
  if (proposal.range.end.getTime() > c.range.end.getTime()) return false;
  if (c.rowIds && !c.rowIds.includes(proposal.rowId)) return false;
  return true;
}

function rangesIntersect(a: TimeRange, b: TimeRange): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

function satisfiesOverlap(
  proposal: DropProposal,
  movingBar: BarSpec,
  ctx: ValidationContext,
): boolean {
  // Default (undefined) and explicit `true` both allow overlap. Only
  // `false` or a function trigger the check.
  if (ctx.eventOverlap === undefined || ctx.eventOverlap === true) return true;
  const overlapFunc = typeof ctx.eventOverlap === 'function' ? ctx.eventOverlap : null;
  // Build the proposed-state bar shape so the predicate sees the
  // mutated range / rowId, not the pre-commit state.
  const proposedMovingBar: BarSpec = {
    ...movingBar,
    rowId: proposal.rowId,
    range: proposal.range,
  };
  for (const stillBar of ctx.bars) {
    if (stillBar.id === movingBar.id) continue;
    // Same-row overlap is allowed — the bar-stack layout pass stacks
    // same-row bars vertically, so they don't visually collide.
    if (stillBar.rowId === proposal.rowId) continue;
    if (!rangesIntersect(proposal.range, stillBar.range)) continue;
    // Cross-row overlap with intersecting ranges. Apply policy.
    if (ctx.eventOverlap === false) return false;
    if (overlapFunc && !overlapFunc(stillBar, proposedMovingBar)) return false;
  }
  return true;
}

/**
 * Validate a proposed bar-drag commit. Short-circuit order: constraint
 * → overlap → allow. Returns `null` on pass, or the first failing
 * `RejectionReason`.
 */
export function validateDrop(
  proposal: DropProposal,
  movingBar: BarSpec,
  ctx: ValidationContext,
): RejectionReason | null {
  if (ctx.eventConstraint && !satisfiesConstraint(proposal, ctx.eventConstraint)) {
    return 'constraint';
  }
  if (!satisfiesOverlap(proposal, movingBar, ctx)) {
    return 'overlap';
  }
  if (ctx.eventAllow && !ctx.eventAllow(proposal, movingBar)) {
    return 'allow';
  }
  return null;
}

/**
 * Validate a proposed bar-resize commit. Algorithmically identical to
 * `validateDrop` — the resize commit produces the same `(range, rowId)`
 * proposal shape; only the caller differs.
 */
export const validateResize = validateDrop;

function satisfiesSelectOverlap(
  proposal: DropProposal,
  bars: readonly BarSpec[],
  effectiveOverlap: boolean | EventOverlapFunc | undefined,
): boolean {
  // Default (undefined) and explicit `true` both allow overlap. Only
  // `false` or a function trigger the check. Same gate semantics as
  // `satisfiesOverlap` for drag/resize, but without the moving-bar
  // identity skip + same-row exemption — range-select has no moving
  // bar, and stacking layout doesn't apply to a hypothetical new
  // range, so every intersecting bar is a candidate.
  if (effectiveOverlap === undefined || effectiveOverlap === true) return true;
  const overlapFunc = typeof effectiveOverlap === 'function' ? effectiveOverlap : null;
  for (const stillBar of bars) {
    if (!rangesIntersect(proposal.range, stillBar.range)) continue;
    if (effectiveOverlap === false) return false;
    // reference passes `(eventImpl, null)` for selectOverlapFunc — chronix
    // passes `(stillBar, null)` directly. The cast is safe because
    // `EventOverlapFunc`'s second arg is type-erased to `BarSpec` and
    // callers that branch on null already gate the param read.
    if (overlapFunc && !overlapFunc(stillBar, null as unknown as BarSpec)) return false;
  }
  return true;
}

/**
 * Validate a proposed calendar-range-select commit. Short-circuit
 * order: constraint → overlap → allow.
 *
 * `selectConstraint` / `selectOverlap` close the previously
 * parked surface. Both options fall back to the `event*` sibling when
 * unset, preserving the v0 "set once, gates both" contract.
 */
export function validateSelect(
  proposal: DropProposal,
  ctx: ValidationContext,
): RejectionReason | null {
  const effectiveConstraint = ctx.selectConstraint ?? ctx.eventConstraint;
  const effectiveOverlap = ctx.selectOverlap ?? ctx.eventOverlap;
  if (effectiveConstraint && !satisfiesConstraint(proposal, effectiveConstraint)) {
    return 'constraint';
  }
  if (!satisfiesSelectOverlap(proposal, ctx.bars, effectiveOverlap)) {
    return 'overlap';
  }
  if (ctx.selectAllow && !ctx.selectAllow(proposal)) {
    return 'allow';
  }
  return null;
}
