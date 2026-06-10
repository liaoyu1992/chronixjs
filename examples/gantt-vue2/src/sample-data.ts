import type { BarSpec, LinkSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Phase 46: today's local midnight, matching `examples/gantt-vue3/src/sample-data.ts`.
 * The axis planner normalizes anchorDate to local midnight, so bars anchored
 * at the same reference produce `x = startHour × pxPerHour` exactly in any
 * timezone. Replaces the prior hardcoded `2026-05-18T00:00:00` anchor so
 * Playwright frozen-clock tests + non-test browser smoke share the same
 * today-relative geometry.
 */
export function todayLocalMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function bar(
  id: string,
  rowId: string,
  startHourFromAnchor: number,
  endHourFromAnchor: number,
  title?: string,
): BarSpec {
  const anchorMs = todayLocalMidnight().getTime();
  return {
    id,
    rowId,
    range: {
      start: new Date(anchorMs + startHourFromAnchor * MS_PER_HOUR),
      end: new Date(anchorMs + endHourFromAnchor * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
    ...(title !== undefined ? { title } : {}),
  };
}

/**
 * Twelve rows × ~22 bars sized to exercise placement across day / week /
 * month / season / halfYear / year views. Bar spans range from a few
 * hours (visible at day view) to multiple days (visible at week+) so
 * every view in the picker shows non-trivial geometry. Phase 31.2's
 * DemoApp.vue copies this list into a mutable `ref<BarSpec[]>` so drag
 * commits persist visually. Phase 31.5.2 expanded from 5 to 12 rows so
 * the demo's default `400px` `maxBodyHeight` cap triggers vertical
 * scroll — visible proof the dual-scrollport architecture works.
 */
// Phase 49: rows gain `region` + `base` columns alongside the existing
// `name` leaf column so the chronix-vue2 sidebar (added in Phase 49)
// can demonstrate vGrouping rowspan merging. Three regions (北区/中区/
// 南区) × 6 base groupings produce visible vertical merges in the
// sidebar table.
export const sampleRows: readonly RowSpec[] = [
  { id: 'r1', columns: { region: '北区', base: '设计基地', name: '设计 Design' } },
  { id: 'r2', columns: { region: '北区', base: '设计基地', name: '前端 Frontend' } },
  { id: 'r3', columns: { region: '北区', base: '工程基地', name: '后端 Backend' } },
  { id: 'r4', columns: { region: '北区', base: '工程基地', name: '测试 QA' } },
  { id: 'r5', columns: { region: '北区', base: '工程基地', name: '发布 Release' } },
  { id: 'r6', columns: { region: '中区', base: '运维基地', name: '运维 DevOps' } },
  { id: 'r7', columns: { region: '中区', base: '运维基地', name: '产品 Product' } },
  { id: 'r8', columns: { region: '中区', base: '数据基地', name: '数据 Data' } },
  { id: 'r9', columns: { region: '中区', base: '数据基地', name: '安全 Security' } },
  { id: 'r10', columns: { region: '南区', base: '客户端基地', name: '客户端 Mobile' } },
  { id: 'r11', columns: { region: '南区', base: '基建基地', name: '基建 Platform' } },
  { id: 'r12', columns: { region: '南区', base: '基建基地', name: '支持 Support' } },
  // Phase 47.4: dedicated row exercising same-row time-overlap stacking
  // (Phase 30 BarPlacementPass + BarStackHeightPass). The 3 bar-stack-*
  // bars below pair-wise overlap so greedy interval coloring assigns
  // levels 0 / 1 / 2 → distinct Y values + row-height expansion to fit
  // 3 stacked tracks. Mirrors chronix-vue3 + chronix-react fixtures so
  // parity-vue2.spec.ts phase30-stacking tests can query the same
  // selectors verbatim.
  { id: 'r13', columns: { region: '南区', base: '基建基地', name: '待排 Stack' } },
];

/**
 * Initial bar set — returned as a fresh array each call so consumers
 * can keep a mutable copy. Used as `ref<BarSpec[]>(initialSampleBars())`
 * in DemoApp.vue so drag/resize/progress commits update the chart
 * reactively.
 *
 * Phase 46: extendedProps.priority added to 3 bars so the
 * `samplePriorityCallback` from `sample-callbacks.ts` has something
 * meaningful to switch on when the `priorityCallback` URL flag is set.
 */
export function initialSampleBars(): BarSpec[] {
  const withPriority = (b: BarSpec, priority: 'high' | 'medium' | 'low'): BarSpec => ({
    ...b,
    extendedProps: { priority },
  });
  return [
    // Design (row 0): 2 bars; d1 starts before the week-view anchor
    // (hour −24) so the Phase 31.4 left-continuation triangle fires
    // in the default week view.
    bar('d1', 'r1', -24, 36, 'Kickoff & wireframes'),
    bar('d2', 'r1', 48, 96, 'High-fidelity mocks'),
    // Frontend (row 1): 3 bars; two overlap to exercise Phase 30 stacking
    withPriority(bar('f1', 'r2', 12, 48, 'Routes & shell'), 'high'),
    bar('f2', 'r2', 36, 72, 'Component library'),
    bar('f3', 'r2', 96, 144, 'Forms & validation'),
    // Backend (row 2): 3 bars
    bar('b1', 'r3', 6, 60, 'DB schema'),
    withPriority(bar('b2', 'r3', 60, 108, 'REST endpoints'), 'medium'),
    bar('b3', 'r3', 120, 180, 'Auth & sessions'),
    // QA (row 3): 3 bars; q3 ends after the week-view axis (hour 192)
    // so the Phase 31.4 right-continuation triangle fires.
    bar('q1', 'r4', 72, 120, 'Smoke tests'),
    bar('q2', 'r4', 120, 144, 'Regression run'),
    bar('q3', 'r4', 156, 192, 'Load tests'),
    // Release (row 4): 2 bars; rel2 ends well past the week-view axis.
    withPriority(bar('rel1', 'r5', 144, 156, 'Stage cut'), 'low'),
    bar('rel2', 'r5', 192, 204, 'Prod ship'),
    // Phase 31.5.2: additional rows so the default 400px maxBodyHeight
    // cap triggers vertical scroll. Each row gets 1-2 modest bars so the
    // chart is visibly busy without overwhelming the demo.
    bar('ops1', 'r6', 30, 90, 'Pipeline setup'),
    bar('ops2', 'r6', 96, 168, 'Monitoring rollout'),
    bar('pm1', 'r7', 0, 72, 'Roadmap alignment'),
    bar('pm2', 'r7', 96, 132, 'Stakeholder review'),
    bar('data1', 'r8', 24, 108, 'ETL refactor'),
    bar('data2', 'r8', 132, 192, 'BI dashboards'),
    bar('sec1', 'r9', 48, 144, 'Threat model'),
    bar('mob1', 'r10', 12, 96, 'iOS prototype'),
    bar('mob2', 'r10', 108, 168, 'Android sync'),
    bar('plat1', 'r11', 0, 84, 'Service mesh'),
    bar('plat2', 'r11', 96, 180, 'Cluster upgrade'),
    bar('sup1', 'r12', 36, 120, 'Customer onboarding'),
    bar('sup2', 'r12', 132, 192, 'Office hours'),
    // Phase 47.4: 3 same-row time-overlapping bars on r13. Sorted-by-start
    // order is bar-stack-1, bar-stack-2, bar-stack-3; all three pair-wise
    // overlap (0-10 ∩ 5-15 ∩ 8-18 are non-empty), so greedy interval
    // coloring assigns levels 0 / 1 / 2 respectively and each renders at
    // a distinct Y. Row height expands automatically to fit 3 stacked
    // tracks via BarStackHeightPass. Bar ids match chronix-vue3 + chronix-
    // react fixtures verbatim so the parity-vue2 phase30-stacking test
    // can query the same selectors.
    bar('bar-stack-1', 'r13', 0, 10, '待排任务 A'),
    bar('bar-stack-2', 'r13', 5, 15, '待排任务 B'),
    bar('bar-stack-3', 'r13', 8, 18, '待排任务 C'),
  ];
}

/**
 * Phase 31.4.1 sample dependency links. Each link uses one of the chronix-
 * supported routings (`'square'` 3-segment elbow / `'smooth'` cubic-Bézier
 * forward-only) and one of the 7 built-in marker shapes. `rel-stagecut`
 * carries a `colorOverride` so the cascade demo shows a per-link color
 * winning over `useLineEventColor` AND `theme.linkDefaultColor`.
 */
export const sampleLinks: readonly LinkSpec[] = [
  { id: 'design→frontend', fromBarId: 'd1', toBarId: 'f1', routing: 'square', marker: 'arrow' },
  // `b2` (60h-108h) starts AFTER `f1` ends (48h), making this a FORWARD
  // smooth link. Targeting `b1` (6h-60h) would make it backward, which
  // the smooth router parks with an explicit throw — see
  // `packages/gantt/src/layout/link-router.ts:116`.
  { id: 'frontend→backend', fromBarId: 'f1', toBarId: 'b2', routing: 'smooth', marker: 'diamond' },
  { id: 'backend→qa', fromBarId: 'b1', toBarId: 'q1', routing: 'square', marker: 'pointer' },
  {
    id: 'rel-stagecut',
    fromBarId: 'q3',
    toBarId: 'rel1',
    routing: 'square',
    marker: 'arrow',
    colorOverride: '#dc2626',
  },
];
