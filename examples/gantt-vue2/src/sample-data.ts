import type { BarSpec, CustomLinkMarker, LinkSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * today's local midnight, matching `examples/gantt-vue3/src/sample-data.ts`.
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

/**
 * Bar with optional progress field. When progressValue is provided,
 * the bar gets a `progress` property with the value and a
 * `pointerOverlayId: 'progress-handle'` so users can drag the
 * progress handle to update completion percentage.
 */
function bar(
  id: string,
  rowId: string,
  startHourFromAnchor: number,
  endHourFromAnchor: number,
  title?: string,
  progressValue?: number,
): BarSpec {
  const anchorMs = todayLocalMidnight().getTime();
  const base: BarSpec = {
    id,
    rowId,
    range: {
      start: new Date(anchorMs + startHourFromAnchor * MS_PER_HOUR),
      end: new Date(anchorMs + endHourFromAnchor * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
    ...(title !== undefined ? { title } : {}),
  };
  return progressValue === undefined
    ? base
    : { ...base, progress: { value: progressValue }, pointerOverlayId: 'progress-handle' };
}

/**
 * Multi-day bar — for week/month/season/halfYear/year views.
 * Accepts optional progressValue for progress tracking.
 */
function multiDayBar(
  id: string,
  rowId: string,
  startDayOffset: number,
  durationDays: number,
  title: string,
  progressValue?: number,
): BarSpec {
  const todayMs = todayLocalMidnight().getTime();
  const base: BarSpec = {
    id,
    rowId,
    range: {
      start: new Date(todayMs + startDayOffset * MS_PER_DAY),
      end: new Date(todayMs + (startDayOffset + durationDays) * MS_PER_DAY),
    },
    title,
    dprIntent: 'crisp-pixel',
  };
  return progressValue === undefined
    ? base
    : { ...base, progress: { value: progressValue }, pointerOverlayId: 'progress-handle' };
}

/**
 * Twelve rows × ~22 bars sized to exercise placement across day / week /
 * month / season / halfYear / year views. Bar spans range from a few
 * hours (visible at day view) to multiple days (visible at week+) so
 * every view in the picker shows non-trivial geometry.
 * DemoApp.vue copies this list into a mutable `ref<BarSpec[]>` so drag
 * commits persist visually. expanded from 5 to 12 rows so
 * the demo's default `400px` `maxBodyHeight` cap triggers vertical
 * scroll — visible proof the dual-scrollport architecture works.
 */
// rows gain `region` + `base` columns alongside the existing
// `name` leaf column so the chronix-vue2 sidebar (added)
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
  // dedicated row exercising same-row time-overlap stacking
  // (BarPlacementPass + BarStackHeightPass). The 3 bar-stack-*
  // bars below pair-wise overlap so greedy interval coloring assigns
  // levels 0 / 1 / 2 → distinct Y values + row-height expansion to fit
  // 3 stacked tracks. Mirrors chronix-vue3 + chronix-react fixtures so
  // parity-vue2.spec.ts phase30-stacking tests can query the same
  // selectors verbatim.
  { id: 'r13', columns: { region: '南区', base: '基建基地', name: '待排 Stack' } },
  // Extra rows to force vertical overflow so the sidebar/chart vertical
  // sync (transform on sidebar-body) is testable in the demo.
  ...Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    return {
      id: `extra-${n}`,
      columns: { region: '扩展区', base: `扩展基地 ${((n - 1) % 4) + 1}`, name: `扩展 ${n}` },
    };
  }),
];

/**
 * Initial bar set — returned as a fresh array each call so consumers
 * can keep a mutable copy. Used as `ref<BarSpec[]>(initialSampleBars())`
 * in DemoApp.vue so drag/resize/progress commits update the chart
 * reactively.
 *
 * extendedProps.priority added to 3 bars so the
 * `samplePriorityCallback` from `sample-callbacks.ts` has something
 * meaningful to switch on when the `priorityCallback` URL flag is set.
 */
export function initialSampleBars(): BarSpec[] {
  const withPriority = (b: BarSpec, priority: 'high' | 'medium' | 'low'): BarSpec => ({
    ...b,
    extendedProps: { priority },
  });
  return [
    // Design (row 0): 4 bars; d1 starts before the week-view anchor
    // (hour −24) so the left-continuation triangle fires
    // in the default week view.
    bar('d1', 'r1', -24, 36, 'Kickoff & wireframes'),
    bar('d2', 'r1', 48, 96, 'High-fidelity mocks'),
    bar('d3', 'r1', 108, 156, 'Design review'),
    bar('d4', 'r1', 162, 198, 'Final signoff'),
    // Frontend (row 1): 5 bars; two overlap to exercise stacking
    withPriority(bar('f1', 'r2', 12, 48, 'Routes & shell', 50), 'high'),
    bar('f2', 'r2', 36, 72, 'Component library'),
    bar('f3', 'r2', 96, 144, 'Forms & validation'),
    bar('f4', 'r2', 150, 186, 'E2E tests'),
    bar('f5', 'r2', 192, 216, 'Performance audit'),
    // Backend (row 2): 5 bars
    bar('b1', 'r3', 6, 60, 'DB schema'),
    withPriority(bar('b2', 'r3', 60, 108, 'REST endpoints', 25), 'medium'),
    bar('b3', 'r3', 120, 180, 'Auth & sessions'),
    bar('b4', 'r3', 186, 210, 'API docs'),
    bar('b5', 'r3', 216, 240, 'Service contracts'),
    // QA (row 3): 4 bars; q3 ends after the week-view axis (hour 192)
    // so the right-continuation triangle fires.
    bar('q1', 'r4', 72, 120, 'Smoke tests'),
    bar('q2', 'r4', 120, 144, 'Regression run'),
    bar('q3', 'r4', 156, 192, 'Load tests'),
    withPriority(bar('q4', 'r4', 198, 228, 'Security scan', 80), 'low'),
    // Release (row 4): 4 bars; rel2 ends well past the week-view axis.
    bar('rel1', 'r5', 144, 156, 'Stage cut'),
    bar('rel2', 'r5', 192, 204, 'Prod ship'),
    bar('rel3', 'r5', 210, 234, 'Hotfix rollout'),
    bar('rel4', 'r5', 240, 264, 'Version tag'),
    // additional rows so the default 400px maxBodyHeight
    // cap triggers vertical scroll. Each row gets 1-2 modest bars so the
    // chart is visibly busy without overwhelming the demo.
    bar('ops1', 'r6', 30, 90, 'Pipeline setup'),
    bar('ops2', 'r6', 96, 168, 'Monitoring rollout'),
    bar('ops3', 'r6', 174, 216, 'Incident response'),
    bar('pm1', 'r7', 0, 72, 'Roadmap alignment'),
    bar('pm2', 'r7', 96, 132, 'Stakeholder review'),
    bar('pm3', 'r7', 138, 180, 'Sprint planning'),
    bar('data1', 'r8', 24, 108, 'ETL refactor'),
    bar('data2', 'r8', 132, 192, 'BI dashboards'),
    bar('data3', 'r8', 198, 234, 'Data warehouse'),
    bar('sec1', 'r9', 48, 144, 'Threat model'),
    bar('sec2', 'r9', 150, 222, 'Pen testing'),
    bar('mob1', 'r10', 12, 96, 'iOS prototype'),
    bar('mob2', 'r10', 108, 168, 'Android sync'),
    bar('mob3', 'r10', 174, 234, 'Cross-platform POC'),
    bar('plat1', 'r11', 0, 84, 'Service mesh'),
    bar('plat2', 'r11', 96, 180, 'Cluster upgrade'),
    bar('plat3', 'r11', 186, 252, 'CDN rollout'),
    bar('sup1', 'r12', 36, 120, 'Customer onboarding'),
    bar('sup2', 'r12', 132, 192, 'Office hours'),
    bar('sup3', 'r12', 198, 240, 'Knowledge base'),
    // 3 same-row time-overlapping bars on r13. Sorted-by-start
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

    // Multi-day bars with progress for week/month/season views
    multiDayBar('multi-d1', 'r1', -10, 5, '已完成任务 (上周)', 100),
    multiDayBar('multi-d2', 'r2', 2, 8, '下周项目 - 主体施工', 30),
    multiDayBar('multi-d3', 'r3', 14, 18, '月内中期 - 设备升级'),
    multiDayBar('multi-d4', 'r4', 25, 35, '跨月任务 - 系统迁移', 15),
    multiDayBar('multi-d5', 'r5', 60, 30, '下季度规划 - 年度大修'),

    // Bars for the extra rows (vertical-sync testing).
    ...Array.from({ length: 20 }, (_, i) => {
      const n = i + 1;
      const start = (n % 10) * 12;
      return bar(`extra-bar-${n}`, `extra-${n}`, start, start + 24, `扩展任务 ${n}`);
    }),
  ];
}

/**
 * A user-supplied marker shape: a stylized heart for one link in the
 * sample set. Proves the `CustomLinkMarker` codepath at both the IR
 * layer (`LinkSpec.marker` accepts an object) and the render layer.
 */
const heartMarker: CustomLinkMarker = {
  id: 'heart',
  viewBox: '0 0 10 10',
  paths: [
    {
      d: 'M 5 8.5 C 1 6 1 1.5 3 1.5 C 4 1.5 4.5 2.5 5 3.5 C 5.5 2.5 6 1.5 7 1.5 C 9 1.5 9 6 5 8.5 Z',
    },
  ],
};

/**
 * sample dependency links. Each link uses one of the chronix-
 * supported routings (`'square'` 3-segment elbow / `'smooth'` cubic-Bézier
 * forward-only) and one of the 7 built-in marker shapes. `rel-stagecut`
 * carries a `colorOverride` so the cascade demo shows a per-link color
 * winning over `useLineEventColor` AND `theme.linkDefaultColor`.
 */
export const sampleLinks: readonly LinkSpec[] = [
  // Original links
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

  // Additional cross-row dependency links for auto-avoidance demonstration
  { id: 'd2→b3', fromBarId: 'd2', toBarId: 'b3', routing: 'smooth', marker: 'circle-hollow' },
  { id: 'f2→q2', fromBarId: 'f2', toBarId: 'q2', routing: 'square', marker: 'plus' },
  { id: 'b1→mob1', fromBarId: 'b1', toBarId: 'mob1', routing: 'smooth', marker: 'arrow' },
  { id: 'q1→plat2', fromBarId: 'q1', toBarId: 'plat2', routing: 'square', marker: 'diamond' },
  {
    id: 'ops1→sec2',
    fromBarId: 'ops1',
    toBarId: 'sec2',
    routing: 'smooth',
    marker: 'pointer',
    colorOverride: '#7c3aed',
  },
  {
    id: 'pm1→data2',
    fromBarId: 'pm1',
    toBarId: 'data2',
    routing: 'square',
    marker: 'circle-hollow',
  },
  { id: 'f3→sup3', fromBarId: 'f3', toBarId: 'sup3', routing: 'smooth', marker: 'plus' },
  { id: 'd3→pm3', fromBarId: 'd3', toBarId: 'pm3', routing: 'square', marker: 'arrow' },
  {
    id: 'b4→rel3',
    fromBarId: 'b4',
    toBarId: 'rel3',
    routing: 'smooth',
    marker: 'diamond',
    colorOverride: '#ea580c',
  },
  { id: 'q2→ops3', fromBarId: 'q2', toBarId: 'ops3', routing: 'square', marker: 'circle-hollow' },
  { id: 'rel2→mob3', fromBarId: 'rel2', toBarId: 'mob3', routing: 'smooth', marker: 'plus' },
  { id: 'data1→plat3', fromBarId: 'data1', toBarId: 'plat3', routing: 'square', marker: 'arrow' },
  { id: 'sec1→sup2', fromBarId: 'sec1', toBarId: 'sup2', routing: 'smooth', marker: 'pointer' },
  { id: 'f4→b5', fromBarId: 'f4', toBarId: 'b5', routing: 'square', marker: 'diamond' },
  {
    id: 'd4→q4',
    fromBarId: 'd4',
    toBarId: 'q4',
    routing: 'smooth',
    marker: 'circle-hollow',
    colorOverride: '#16a34a',
  },
  // Custom heart marker link
  {
    id: 'd3→multi-d3-heart',
    fromBarId: 'd3',
    toBarId: 'multi-d3',
    routing: 'smooth',
    marker: heartMarker,
    colorOverride: '#10b981',
  },
];
