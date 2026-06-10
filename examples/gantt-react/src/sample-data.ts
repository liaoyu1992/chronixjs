import type { BarSpec, LinkSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

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
];

/**
 * Phase 32.4.1 — demonstration dependency lines. Connect the design →
 * frontend → backend → QA → release vertical pipeline so the
 * continuation triangles + bar fills + cascade colors all visually
 * compose with link rendering in the demo. `routing: 'square'` for
 * all (chronix v0's smooth routing is forward-only and limited).
 */
export const sampleLinks: readonly LinkSpec[] = [
  { id: 'l1', fromBarId: 'd1', toBarId: 'f1', routing: 'square', marker: 'arrow' },
  { id: 'l2', fromBarId: 'f1', toBarId: 'b1', routing: 'square', marker: 'arrow' },
  { id: 'l3', fromBarId: 'b2', toBarId: 'q1', routing: 'square', marker: 'arrow' },
  { id: 'l4', fromBarId: 'q1', toBarId: 'rel1', routing: 'square', marker: 'arrow' },
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
    withPriority(bar('f1', 'r2', 12, 48, 'Routes & shell'), 'high'),
    bar('f2', 'r2', 36, 72, 'Component library'),
    bar('f3', 'r2', 96, 144, 'Forms & validation'),
    bar('b1', 'r3', 6, 60, 'DB schema'),
    withPriority(bar('b2', 'r3', 60, 108, 'REST endpoints'), 'medium'),
    // `b3` ends AFTER the week view so the right-continuation triangle
    // fires when viewing 'week'.
    bar('b3', 'r3', 120, 200, 'Auth & sessions'),
    bar('q1', 'r4', 72, 120, 'Smoke tests'),
    bar('q2', 'r4', 120, 144, 'Regression run'),
    bar('q3', 'r4', 156, 192, 'Load tests'),
    withPriority(bar('rel1', 'r5', 144, 156, 'Stage cut'), 'low'),
    bar('rel2', 'r5', 192, 204, 'Prod ship'),
    // Phase 32.5 — 12-row expansion. Additional bars across rows 6-12
    // demonstrate the dual-scrollport vertical scrollbar when
    // `maxBodyHeight` constrains the chart pane.
    bar('ops1', 'r6', 0, 24, 'CI pipeline'),
    bar('ops2', 'r6', 96, 144, 'Monitoring setup'),
    bar('p1', 'r7', 0, 60, 'Roadmap planning'),
    bar('p2', 'r7', 72, 168, 'Stakeholder sync'),
    bar('sec1', 'r8', 24, 72, 'Threat modeling'),
    bar('sec2', 'r8', 120, 168, 'Pen test'),
    bar('data1', 'r9', 36, 96, 'Schema migration'),
    bar('data2', 'r9', 120, 192, 'ETL pipeline'),
    bar('sup1', 'r10', 48, 120, 'Docs portal'),
    bar('sup2', 'r10', 144, 192, 'Helpdesk setup'),
    bar('mkt1', 'r11', 0, 96, 'Launch campaign'),
    bar('mkt2', 'r11', 120, 168, 'Press kit'),
    bar('leg1', 'r12', 24, 72, 'License review'),
    bar('leg2', 'r12', 144, 192, 'TOS update'),
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
  ];
}
