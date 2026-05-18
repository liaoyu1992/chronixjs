/**
 * **Single source of truth for the cross-demo parity dataset.**
 *
 * Both the chronix demo (when loaded with `?parity=true`) AND the
 * Playwright parity tests (in `tests/parity.spec.ts`) consume this
 * module. Keeping the dataset in one place eliminates the drift risk
 * that would arise if the chronix demo and the test fixture each
 * carried their own copy of "the 25 events used for cross-demo
 * comparison".
 *
 * Why this lives under `tooling/golden-runner/src/`:
 * - The dataset is a TESTING fixture, not chronix application code —
 *   chronix's published API surface (`@chronixjs/gantt`,
 *   `@chronixjs/gantt-vue3`) doesn't ship it.
 * - The chronix demo workspace already depends on
 *   `@chronixjs/golden-runner` transitively (via parity-mode loading
 *   the dataset), which is acceptable because example workspaces are
 *   not published to npm.
 *
 * The data mirrors the k-ui demo's `generateTestEvents()` at
 * `examples/gantt/vue3/src/DemoApp.vue:691-1271` plus the 32-resource
 * `RESOURCES[]` array at `DemoApp.vue:23-410`. Only the geometry-
 * relevant fields (id, resourceId, start/end epoch math) are
 * mirrored; styling fields (backgroundColor, dependencies,
 * extendedProps) are NOT in scope because chronix v0 parity only
 * compares observable geometry (x / width / y / height).
 */

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * The 32 resource ids in the k-ui demo's `RESOURCES[]` array order
 * (NOT the rendered order, which differs because k-ui groups by
 * `baseName` for the left panel display).
 *
 * Chronix v0 parity mode emits rows in this order, accepting that
 * the rendered Y position will NOT match k-ui's because chronix
 * doesn't replicate the baseName grouping. Cross-demo Y parity is
 * parked until a resource-hierarchy row sorter lands.
 */
export const PARITY_RESOURCE_IDS: readonly string[] = [
  '32',
  '25',
  '16',
  '17',
  '30',
  '23',
  '19',
  '20',
  '24',
  '22',
  '18',
  '26',
  '29',
  '21',
  '28',
  '31',
  '27',
  '33',
  '3',
  '4',
  '5',
  '6',
  '2',
  '7',
  '8',
  '14',
  '15',
  '13',
  '9',
  '10',
  '11',
  '12',
];

export interface ParityEvent {
  readonly id: string;
  readonly resourceId: string;
  readonly startMs: number;
  readonly endMs: number;
  /** 0..100 progress percentage; undefined when the parity-reference event has no progress field. */
  readonly progressValue?: number;
  /**
   * Phase 28.2: bar title text. Mirrors the parity-reference demo's
   * per-event `title` field so cross-demo content parity (Set of
   * truncated text contents) holds. Always present — every event
   * in the reference fixture carries a title.
   */
  readonly title: string;
  /**
   * Phase 28.3.1: per-event bar background color. Populated only for
   * events that appear as the source OR target of an entry in
   * `PARITY_LINKS`, so the demo paints those bars in distinct
   * per-event colors — required for cross-demo `useLineEventColor`
   * parity (different source bars → different line stroke colors).
   *
   * Events not referenced by any parity link leave this `undefined`
   * and continue to inherit the chart-level prop color
   * (`PARITY_REFERENCE_COLOR = '#3788d8'`) the existing parity-mode
   * tests assume. This keeps Phase 28.3.1's fixture impact scoped to
   * the link-cascade coverage path.
   */
  readonly backgroundColor?: string;
}

/**
 * Returns ms epoch for `todayMs + dayOffset days + hour:minute`,
 * mirroring the k-ui demo's
 * `formatDateTime(addDays(today, N), H, M)` chain at the epoch
 * level — avoids the `YYYY-MM-DD HH:mm:ss` string roundtrip that
 * would re-parse through `new Date(...)` and pick up the local
 * timezone a second time.
 */
function eventEpoch(todayMs: number, dayOffset: number, hour: number, minute = 0): number {
  return todayMs + dayOffset * MS_PER_DAY + hour * MS_PER_HOUR + minute * 60 * 1000;
}

/**
 * Build the 25-event parity dataset anchored at `todayMs` (local
 * midnight). Each entry corresponds to one event in the parity-
 * reference demo's event-generator output; the
 * (id, resourceId, startMs, endMs) fields are the cross-demo
 * identity tuple. Progress values mirror the reference fixture's
 * progress fields where present. Per-event `backgroundColor` values
 * (Phase 28.3.1) populate only for events that appear as endpoints
 * in `PARITY_LINKS` — see the `ParityEvent.backgroundColor` JSDoc.
 */
export function buildParityEvents(todayMs: number): readonly ParityEvent[] {
  const E = (
    id: string,
    resourceId: string,
    title: string,
    sd: number,
    sh: number,
    ed: number,
    eh: number,
    progressValue?: number,
    backgroundColor?: string,
    sm = 0,
    em = 0,
  ): ParityEvent => ({
    id,
    resourceId,
    title,
    startMs: eventEpoch(todayMs, sd, sh, sm),
    endMs: eventEpoch(todayMs, ed, eh, em),
    ...(progressValue !== undefined ? { progressValue } : {}),
    ...(backgroundColor !== undefined ? { backgroundColor } : {}),
  });
  // Titles + per-event backgrounds mirror the parity-reference demo's
  // event entries. `backgroundColor` populates for events touched by
  // `PARITY_LINKS` (Phase 28.3.1) using the reference fixture's
  // per-event color verbatim so cross-demo `useLineEventColor` color
  // sets match.
  return [
    E('event-1', '32', 'A33机型-大修项目-阶段1', -5, 8, -2, 18, 60, '#ff3b32'),
    E('event-2', '25', 'A33-发动机检查', -3, 9, +1, 17, 40, '#ff9800'),
    E('event-3', '25', 'A33-起落架维护', +2, 8, +5, 16, 0, '#2196f3'),
    E('event-4', '16', 'A33-液压系统检修', -2, 10, +2, 15, undefined, '#4caf50'),
    E('event-5', '16', 'A33-电气系统检查', +3, 9, +7, 17),
    E('event-6', '19', 'A32-机身检查', -7, 8, -3, 18),
    E('event-7', '19', 'A32-发动机大修', -1, 9, +10, 16, undefined, '#f44336'),
    E('event-8', '20', 'A32-73N-综合检查', 0, 8, +5, 18, undefined, '#00bcd4'),
    E('event-9', '18', 'A32-航电系统升级', +1, 10, +7, 15),
    E('event-10', '21', '73M-73N-发动机更换', -5, 8, +3, 18),
    E('event-11', '21', '73M-73N-系统测试', +4, 9, +14, 17),
    E('event-12', '33', '787机型-4C检查-阶段1', -3, 8, +5, 18),
    E('event-13', '3', '73M-73N-起落架大修', -2, 9, +7, 16),
    E('event-14', '3', '73M-73N-液压系统检修', +8, 8, +20, 17),
    E('event-15', '4', '73N-发动机检查', 0, 10, +5, 15),
    E('event-16', '2', '73N-航电系统检查', +1, 9, +10, 16),
    E('event-17', '8', 'A32-73N-综合维护', -1, 8, +7, 18, 50),
    E('event-18', '9', '多机型-综合测试', +3, 10, +14, 17),
    E('event-19', '9', '多机型-最终验收', +15, 9, +30, 16),
    E('event-20', '28', '紧急维修-故障排除', -1, 14, +2, 20),
    E('event-21', '10', '紧急维修-部件更换', 0, 13, +3, 19),
    E('event-22', '31', '长期停场-定期检查', -7, 8, +20, 18, undefined, '#5c6bc0'),
    E('event-23', '11', '长期停场-维护保养', -5, 9, +25, 17, undefined, '#7e57c2'),
    E('event-24', '27', '封存-预处理', +5, 8, +14, 16),
    E('event-25', '12', '封存-最终处理', +15, 9, +30, 17),
  ];
}

/**
 * Phase 28.3.1: per-link parity fixture entry. Cross-demo identity
 * tuple = `(fromBarId, toBarId)`; both sides resolve the same source
 * + target bar (parity events use stable `event-N` ids). Routing +
 * marker shape are not part of the identity — v0 fixture pins both
 * to a single value to keep the marker-def set tractable.
 */
export interface ParityLink {
  /** Composed as `link-${fromBarId}-${toBarId}`. */
  readonly id: string;
  readonly fromBarId: string;
  readonly toBarId: string;
}

/**
 * Phase 28.3.1: curated 8-edge subset of the parity-reference demo's
 * ~22 dependency edges. Selection criteria (per
 * `audit/PHASE_28_3_1_LINK_PARITY_FIXTURE_DESIGN.md` Decision 1):
 *
 *   1. Source bars span ≥3 distinct per-event colors so the
 *      `useLineEventColor: true` cascade produces a non-trivial
 *      stroke-color set (avoids the single-color trivial case).
 *   2. Routes cross multiple resource rows so links visibly route
 *      across the chart in cross-demo screenshot captures.
 *   3. Source + target events both fall inside the rendered axis
 *      window across day / week / month views (~-7..+30 day offset
 *      from the frozen anchor; all 8 selected event-pairs qualify).
 *   4. Count moderate (~8) so the cross-demo assertions stay fast
 *      and the cross-demo VRT re-baseline burden stays small.
 *
 * Distinct source-bar colors covered: red (`#ff3b32`, `#f44336`),
 * orange (`#ff9800`), green (`#4caf50`), cyan (`#00bcd4`), indigo
 * (`#5c6bc0`), deep-purple (`#7e57c2`) — 7 distinct hex values
 * across 8 source-bar references.
 */
export const PARITY_LINKS: readonly ParityLink[] = [
  { id: 'link-event-1-event-2', fromBarId: 'event-1', toBarId: 'event-2' },
  { id: 'link-event-1-event-4', fromBarId: 'event-1', toBarId: 'event-4' },
  { id: 'link-event-2-event-3', fromBarId: 'event-2', toBarId: 'event-3' },
  { id: 'link-event-4-event-5', fromBarId: 'event-4', toBarId: 'event-5' },
  { id: 'link-event-2-event-5', fromBarId: 'event-2', toBarId: 'event-5' },
  { id: 'link-event-7-event-8', fromBarId: 'event-7', toBarId: 'event-8' },
  { id: 'link-event-22-event-23', fromBarId: 'event-22', toBarId: 'event-23' },
  { id: 'link-event-23-event-24', fromBarId: 'event-23', toBarId: 'event-24' },
];

/**
 * Phase 28.3.1: return the parity link set. Currently a thin wrapper
 * around `PARITY_LINKS` for symmetry with `buildParityEvents()`;
 * the function form leaves room for future per-anchor / per-view
 * filtering without breaking call sites.
 */
export function buildParityLinks(): readonly ParityLink[] {
  return PARITY_LINKS;
}
