import type { BarSpec, CustomLinkMarker, LinkSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Phase 46: today's local midnight, matching `examples/gantt-vue3/src/sample-data.ts`.
 * The axis planner normalizes anchorDate to local midnight, so bars
 * anchored at the same reference produce `x = startHour × pxPerHour`
 * exactly in any timezone. Replaces the prior hardcoded
 * `2026-05-18T00:00:00` anchor so Playwright frozen-clock tests +
 * non-test browser smoke share the same today-relative geometry.
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
 * Phase 32.5 / Phase 48: 12 rows × 27 bars exercise placement across
 * day / week / month / season / halfYear / year views AND demonstrate
 * the dual-scrollport vertical scrollbar. Total content height ≈ 470 px
 * → exceeds the `maxBodyHeight: '70vh'` cap → vertical scrollbar
 * engages.
 *
 * Phase 48 adds two grouped columns (`region`, `base`) ahead of the
 * existing `name` leaf column so the chronix-react sidebar can
 * demonstrate vGrouping rowspan merging: consecutive rows sharing the
 * same region / base collapse to one cell. Mirror of vue3's region /
 * base / name 5-row dataset, scaled to 12 rows.
 */
export const sampleRows: readonly RowSpec[] = [
  { id: 'r1', columns: { region: '北区', base: '设计基地', name: '设计 Design' } },
  { id: 'r2', columns: { region: '北区', base: '设计基地', name: '前端 Frontend' } },
  { id: 'r3', columns: { region: '北区', base: '工程基地', name: '后端 Backend' } },
  { id: 'r4', columns: { region: '北区', base: '工程基地', name: '测试 QA' } },
  { id: 'r5', columns: { region: '北区', base: '工程基地', name: '发布 Release' } },
  { id: 'r6', columns: { region: '中区', base: '运维基地', name: '运维 DevOps' } },
  { id: 'r7', columns: { region: '中区', base: '运维基地', name: '产品 Product' } },
  { id: 'r8', columns: { region: '中区', base: '安全基地', name: '安全 Security' } },
  { id: 'r9', columns: { region: '南区', base: '数据基地', name: '数据 Data' } },
  { id: 'r10', columns: { region: '南区', base: '数据基地', name: '客服 Support' } },
  { id: 'r11', columns: { region: '南区', base: '业务基地', name: '市场 Marketing' } },
  { id: 'r12', columns: { region: '南区', base: '业务基地', name: '法务 Legal' } },
  // Phase 47.3: dedicated row exercising same-row time-overlap stacking
  // (Phase 30 BarPlacementPass + BarStackHeightPass). The 3 bar-stack-*
  // bars below pair-wise overlap so greedy interval coloring assigns
  // levels 0 / 1 / 2 → distinct Y values + row-height expansion to fit
  // 3 stacked tracks. Mirrors vue3 demo's workshop-stack row purpose
  // with chronix-react's existing 南区 / 业务基地 vGrouping pattern.
  { id: 'r13', columns: { region: '南区', base: '业务基地', name: '待排 Stack' } },
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
 * Phase 32.4.1 — demonstration dependency lines. Connect the design →
 * frontend → backend → QA → release vertical pipeline so the
 * continuation triangles + bar fills + cascade colors all visually
 * compose with link rendering in the demo. `routing: 'square'` for
 * all (chronix v0's smooth routing is forward-only and limited).
 */

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

export const sampleLinks: readonly LinkSpec[] = [
  // Original links
  { id: 'l1', fromBarId: 'd1', toBarId: 'f1', routing: 'square', marker: 'arrow' },
  { id: 'l2', fromBarId: 'f1', toBarId: 'b1', routing: 'square', marker: 'arrow' },
  { id: 'l3', fromBarId: 'b2', toBarId: 'q1', routing: 'square', marker: 'arrow' },
  { id: 'l4', fromBarId: 'q1', toBarId: 'rel1', routing: 'square', marker: 'arrow' },

  // Additional cross-row dependency links for auto-avoidance demonstration
  { id: 'l5', fromBarId: 'd2', toBarId: 'f3', routing: 'smooth', marker: 'diamond' },
  { id: 'l6', fromBarId: 'f2', toBarId: 'b3', routing: 'square', marker: 'circle-hollow' },
  { id: 'l7', fromBarId: 'b1', toBarId: 'q2', routing: 'smooth', marker: 'plus' },
  { id: 'l8', fromBarId: 'q1', toBarId: 'rel2', routing: 'square', marker: 'pointer' },
  {
    id: 'l9',
    fromBarId: 'ops1',
    toBarId: 'sec2',
    routing: 'smooth',
    marker: 'arrow',
    colorOverride: '#7c3aed',
  },
  { id: 'l10', fromBarId: 'p1', toBarId: 'data2', routing: 'square', marker: 'diamond' },
  { id: 'l11', fromBarId: 'f3', toBarId: 'sup3', routing: 'smooth', marker: 'circle-hollow' },
  { id: 'l12', fromBarId: 'd3', toBarId: 'p3', routing: 'square', marker: 'plus' },
  {
    id: 'l13',
    fromBarId: 'b4',
    toBarId: 'rel3',
    routing: 'smooth',
    marker: 'pointer',
    colorOverride: '#ea580c',
  },
  { id: 'l14', fromBarId: 'q2', toBarId: 'ops3', routing: 'square', marker: 'arrow' },
  { id: 'l15', fromBarId: 'rel2', toBarId: 'mkt3', routing: 'smooth', marker: 'diamond' },
  { id: 'l16', fromBarId: 'data1', toBarId: 'leg3', routing: 'square', marker: 'circle-hollow' },
  { id: 'l17', fromBarId: 'sec1', toBarId: 'sup2', routing: 'smooth', marker: 'plus' },
  { id: 'l18', fromBarId: 'f4', toBarId: 'b4', routing: 'square', marker: 'pointer' },
  {
    id: 'l19',
    fromBarId: 'd4',
    toBarId: 'q4',
    routing: 'smooth',
    marker: 'arrow',
    colorOverride: '#16a34a',
  },
  // Custom heart marker link
  {
    id: 'l20-heart',
    fromBarId: 'd3',
    toBarId: 'multi-d3',
    routing: 'smooth',
    marker: heartMarker,
    colorOverride: '#10b981',
  },
];

/**
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
    // `d1` starts BEFORE the anchor so Phase 32.4's continuation triangle
    // fires on its left edge — visible immediately when the demo loads.
    bar('d1', 'r1', -36, 60, 'Kickoff & wireframes'),
    bar('d2', 'r1', 48, 96, 'High-fidelity mocks'),
    bar('d3', 'r1', 108, 168, 'Design review'),
    bar('d4', 'r1', 174, 216, 'Final signoff'),
    withPriority(bar('f1', 'r2', 12, 48, 'Routes & shell', 50), 'high'),
    bar('f2', 'r2', 36, 72, 'Component library'),
    bar('f3', 'r2', 96, 144, 'Forms & validation'),
    bar('f4', 'r2', 150, 192, 'E2E tests'),
    bar('f5', 'r2', 198, 240, 'Performance audit'),
    bar('b1', 'r3', 6, 60, 'DB schema'),
    withPriority(bar('b2', 'r3', 60, 108, 'REST endpoints', 25), 'medium'),
    // `b3` ends AFTER the week view so the right-continuation triangle
    // fires when viewing 'week'.
    bar('b3', 'r3', 120, 200, 'Auth & sessions'),
    bar('b4', 'r3', 204, 252, 'API documentation'),
    bar('q1', 'r4', 72, 120, 'Smoke tests'),
    bar('q2', 'r4', 120, 144, 'Regression run'),
    bar('q3', 'r4', 156, 192, 'Load tests'),
    withPriority(bar('q4', 'r4', 198, 234, 'Security scan', 80), 'low'),
    bar('rel1', 'r5', 144, 156, 'Stage cut'),
    bar('rel2', 'r5', 192, 204, 'Prod ship'),
    bar('rel3', 'r5', 210, 258, 'Hotfix rollout'),
    // Phase 32.5 — 12-row expansion. Additional bars across rows 6-12
    // demonstrate the dual-scrollport vertical scrollbar when
    // `maxBodyHeight` constrains the chart pane.
    bar('ops1', 'r6', 0, 24, 'CI pipeline'),
    bar('ops2', 'r6', 96, 144, 'Monitoring setup'),
    bar('ops3', 'r6', 150, 222, 'Incident response'),
    bar('p1', 'r7', 0, 60, 'Roadmap planning'),
    bar('p2', 'r7', 72, 168, 'Stakeholder sync'),
    bar('p3', 'r7', 174, 240, 'Sprint planning'),
    bar('sec1', 'r8', 24, 72, 'Threat modeling'),
    bar('sec2', 'r8', 120, 168, 'Pen test'),
    bar('sec3', 'r8', 174, 246, 'Compliance audit'),
    bar('data1', 'r9', 36, 96, 'Schema migration'),
    bar('data2', 'r9', 120, 192, 'ETL pipeline'),
    bar('data3', 'r9', 198, 264, 'Data warehouse'),
    bar('sup1', 'r10', 48, 120, 'Docs portal'),
    bar('sup2', 'r10', 144, 192, 'Helpdesk setup'),
    bar('sup3', 'r10', 198, 252, 'Knowledge base'),
    bar('mkt1', 'r11', 0, 96, 'Launch campaign'),
    bar('mkt2', 'r11', 120, 168, 'Press kit'),
    bar('mkt3', 'r11', 174, 240, 'User research'),
    bar('leg1', 'r12', 24, 72, 'License review'),
    bar('leg2', 'r12', 144, 192, 'TOS update'),
    bar('leg3', 'r12', 198, 270, 'Patent filing'),
    // Phase 47.3: 3 same-row time-overlapping bars on r13. Sorted-by-start
    // order is bar-stack-1, bar-stack-2, bar-stack-3; all three pair-wise
    // overlap (0-10 ∩ 5-15 ∩ 8-18 are non-empty), so greedy interval
    // coloring assigns levels 0 / 1 / 2 respectively and each renders at
    // a distinct Y. Row height expands automatically to fit 3 stacked
    // tracks via BarStackHeightPass. Bar ids match the vue3 demo's
    // workshop-stack bars verbatim so cross-demo phase30 stacking tests
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
