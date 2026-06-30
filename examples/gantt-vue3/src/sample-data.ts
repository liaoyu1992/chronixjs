import type { BarSpec, CustomLinkMarker, LinkSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// Local midnight today. The axis planner normalizes anchorDate to local
// midnight, so bar epochs anchored at the same reference produce
// `x = startHour × pxPerHour` exactly in any timezone.
export function todayLocalMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function barAt(
  id: string,
  rowId: string,
  startHour: number,
  endHour: number,
  title: string,
  progressValue?: number,
): BarSpec {
  const todayMs = todayLocalMidnight().getTime();
  const base: BarSpec = {
    id,
    rowId,
    range: {
      start: new Date(todayMs + startHour * MS_PER_HOUR),
      end: new Date(todayMs + endHour * MS_PER_HOUR),
    },
    title,
    dprIntent: 'crisp-pixel',
  };
  return progressValue === undefined
    ? base
    : { ...base, progress: { value: progressValue }, pointerOverlayId: 'progress-handle' };
}

/**
 * Bar whose duration spans multiple days — for the week / month / season
 * / halfYear / year views to show meaningful content across the full
 * axis. Day view will render any portion that overlaps the
 * today-midnight ... today-midnight+24h window; if the bar is entirely
 * before / after today, BarPlacementPass still produces a `PlacedBar`
 * but its x falls outside the axis bounds and the viewport hides it.
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

export const sampleRows: readonly RowSpec[] = [
  // Region + base columns share values across consecutive rows so the
  // sidebar's vGrouping (rowspan merge) is visible: 海口 spans rows
  // 1–3 in the region column; 海口基地 spans rows 1–2 in the base
  // column. Name is the leaf column — one cell per row.
  { id: 'workshop-a', columns: { region: '海口', base: '海口基地', name: '车间 A' } },
  { id: 'workshop-b', columns: { region: '海口', base: '海口基地', name: '车间 B' } },
  { id: 'workshop-c', columns: { region: '海口', base: '空港基地', name: '车间 C' } },
  { id: 'workshop-d', columns: { region: '三亚', base: '三亚基地', name: '车间 D' } },
  { id: 'workshop-e', columns: { region: '三亚', base: '三亚基地', name: '车间 E' } },
  { id: 'workshop-f', columns: { region: '三亚', base: '三亚基地', name: '车间 F' } },
  // dedicated row exercising same-row time-overlap stacking.
  // Before chronix collapsed all overlapping bars to identical
  // Y (one rendered, others hidden). After: each gets its own stack level
  // and renders at a distinct Y within the row.
  { id: 'workshop-stack', columns: { region: '三亚', base: '三亚基地', name: '待排' } },
  // Extra rows to force vertical overflow so the sidebar/chart vertical
  // sync (transform on sidebar-body) is testable in the demo.
  ...Array.from({ length: 24 }, (_, i) => {
    const n = i + 1;
    return {
      id: `extra-${n}`,
      columns: {
        region: '扩展区',
        base: `扩展基地 ${((n - 1) % 4) + 1}`,
        name: `扩展车间 ${n}`,
      },
    };
  }),
];

// a few bars get `extendedProps.priority` so the demo's
// bar-color callback toggle has something meaningful to switch on.
// `extendedProps` is the BarSpec slot for user-supplied opaque
// payload — chronix never inspects it.
const HIGH_PRIORITY = { priority: 'high' } as const;
const MEDIUM_PRIORITY = { priority: 'medium' } as const;
const LOW_PRIORITY = { priority: 'low' } as const;

function withPriority<T extends BarSpec>(
  b: T,
  priority: typeof HIGH_PRIORITY | typeof MEDIUM_PRIORITY | typeof LOW_PRIORITY,
): T {
  return { ...b, extendedProps: priority };
}

export const sampleBars: readonly BarSpec[] = [
  // Today's hour-scale bars — day view shows these in detail.
  barAt('bar-1', 'workshop-a', 1, 5, '设备维护 - 起点'),
  withPriority(barAt('bar-2', 'workshop-a', 8, 12, '系统检查', 50), HIGH_PRIORITY),
  barAt('bar-3', 'workshop-a', 15, 22, '夜间检修'),
  barAt('bar-4', 'workshop-b', 2, 7, '日常巡检'),
  withPriority(barAt('bar-5', 'workshop-b', 10, 18, '主要维护', 25), MEDIUM_PRIORITY),
  barAt('bar-6', 'workshop-c', 6, 14, '部件更换'),
  barAt('bar-7', 'workshop-c', 16, 20, '验证测试'),
  withPriority(barAt('bar-8', 'workshop-d', 4, 11, '综合检修', 80), LOW_PRIORITY),

  // Additional bars for auto-avoidance demonstration
  // These create scenarios where dependency lines pass through other bars
  barAt('bar-17', 'workshop-a', 12, 16, 'A-中期任务'),
  barAt('bar-18', 'workshop-b', 18, 23, 'B-晚间任务'),
  barAt('bar-19', 'workshop-c', 0, 3, 'C-清晨任务'),
  barAt('bar-20', 'workshop-d', 12, 17, 'D-下午巡检'),
  barAt('bar-21', 'workshop-e', 3, 9, 'E-上午任务'),
  barAt('bar-22', 'workshop-e', 13, 19, 'E-下午任务'),
  barAt('bar-23', 'workshop-f', 5, 11, 'F-上午检修'),
  barAt('bar-24', 'workshop-f', 14, 21, 'F-下午维护'),

  // Multi-day bars — fill week / month / season / halfYear / year views.
  // Offsets chosen to land each bar in a distinct stretch of the wider
  // axes so each view shows visible content across its full width.
  multiDayBar('bar-9', 'workshop-a', -10, 5, '已完成任务 (上周)', 100),
  multiDayBar('bar-10', 'workshop-b', 2, 8, '下周项目 - 主体施工', 30),
  multiDayBar('bar-11', 'workshop-c', 14, 18, '月内中期 - 设备升级'),
  multiDayBar('bar-12', 'workshop-d', 25, 35, '跨月任务 - 系统迁移', 15),
  multiDayBar('bar-13', 'workshop-a', 60, 30, '下季度规划 - 年度大修'),
  multiDayBar('bar-14', 'workshop-b', 120, 60, '下半年项目 - 工艺改造'),
  multiDayBar('bar-15', 'workshop-c', 210, 45, '年末交付 - 客户验收'),
  multiDayBar('bar-16', 'workshop-d', 300, 30, '次年初规划', 5),
  multiDayBar('bar-25', 'workshop-e', 5, 12, 'E-多日任务 A', 40),
  multiDayBar('bar-26', 'workshop-f', 8, 15, 'F-多日任务 B', 60),

  // 3 same-row time-overlapping bars on the dedicated stacking
  // row. Sorted-by-start order is bar-stack-1, bar-stack-2, bar-stack-3;
  // all three pair-wise overlap (0-10 ∩ 5-15 ∩ 8-18 are non-empty), so
  // greedy interval coloring assigns levels 0 / 1 / 2 respectively and
  // each renders at a distinct Y on a row tall enough for 3 stacked
  // tracks (BarStackHeightPass expands row height automatically).
  barAt('bar-stack-1', 'workshop-stack', 0, 10, '待排任务 A'),
  barAt('bar-stack-2', 'workshop-stack', 5, 15, '待排任务 B'),
  barAt('bar-stack-3', 'workshop-stack', 8, 18, '待排任务 C'),
  // Bars for the extra rows (vertical-sync testing).
  ...Array.from({ length: 24 }, (_, i) => {
    const n = i + 1;
    const start = (n % 12) * 2;
    return barAt(`extra-bar-${n}`, `extra-${n}`, start, start + 4, `扩展任务 ${n}`);
  }),
];

/**
 * A user-supplied marker shape: a stylized heart for one link in the
 * sample set. Proves the `CustomLinkMarker` codepath at both the IR
 * layer (`LinkSpec.marker` accepts an object) and the render layer
 * (`<ChronixGantt>` emits a `<marker>` with the custom paths).
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
 * Sample dependency links. Covers the (routing × marker × color) matrix
 * laid out in `audit/PHASE_8_LINK_RENDERING_DESIGN.md`: both routings,
 * 5 of the 7 built-in markers, one colorOverride, and one
 * CustomLinkMarker. **All forward** (target's x ≥ source's x) — backward
 * smooth routing is parked at the router layer with an explicit throw,
 * so the demo data must respect the forward-only invariant.
 *
 * Hour ranges below describe the day-view geometry. Multi-day bars
 * (`bar-9..bar-16`) anchor at full-day offsets so they all land far to
 * the right of any today-anchored bar — any link from a today bar to a
 * multi-day bar is automatically forward across all 6 views.
 */
export const sampleLinks: readonly LinkSpec[] = [
  // Original links
  // bar-1 (a, 1–5h) → bar-2 (a, 8–12h): same row, forward (5 < 8).
  { id: 'link-1', fromBarId: 'bar-1', toBarId: 'bar-2', routing: 'square', marker: 'arrow' },
  // bar-4 (b, 2–7h) → bar-5 (b, 10–18h): same row, forward (7 < 10).
  { id: 'link-2', fromBarId: 'bar-4', toBarId: 'bar-5', routing: 'square', marker: 'diamond' },
  // bar-1 (a, 1–5h) → bar-6 (c, 6–14h): cross-row a→c, forward (5 < 6),
  // smooth Bézier branch.
  { id: 'link-3', fromBarId: 'bar-1', toBarId: 'bar-6', routing: 'smooth', marker: 'arrow' },
  // bar-8 (d, 4–11h) → bar-3 (a, 15–22h): cross-row d→a, forward
  // (11 < 15), smooth + circle-hollow + red colorOverride.
  {
    id: 'link-4',
    fromBarId: 'bar-8',
    toBarId: 'bar-3',
    routing: 'smooth',
    marker: 'circle-hollow',
    colorOverride: '#ef4444',
  },
  // bar-6 (c, 6–14h) → bar-7 (c, 16–20h): same row, forward (14 < 16),
  // square + plus marker.
  { id: 'link-5', fromBarId: 'bar-6', toBarId: 'bar-7', routing: 'square', marker: 'plus' },
  // bar-3 (a, 15–22h today) → bar-11 (c, +14 days): cross-row a→c,
  // forward across all views, smooth + custom heart + green override.
  {
    id: 'link-6',
    fromBarId: 'bar-3',
    toBarId: 'bar-11',
    routing: 'smooth',
    marker: heartMarker,
    colorOverride: '#10b981',
  },

  // Additional links for auto-avoidance demonstration
  // Cross-row links that may trigger auto-avoidance
  { id: 'link-7', fromBarId: 'bar-1', toBarId: 'bar-22', routing: 'smooth', marker: 'arrow' }, // a→e, passes through b,c,d
  { id: 'link-8', fromBarId: 'bar-4', toBarId: 'bar-24', routing: 'smooth', marker: 'diamond' }, // b→f
  { id: 'link-9', fromBarId: 'bar-19', toBarId: 'bar-18', routing: 'square', marker: 'arrow' }, // c→b
  {
    id: 'link-10',
    fromBarId: 'bar-21',
    toBarId: 'bar-20',
    routing: 'smooth',
    marker: 'circle-hollow',
  }, // e→d
  { id: 'link-11', fromBarId: 'bar-17', toBarId: 'bar-23', routing: 'smooth', marker: 'plus' }, // a→f
  { id: 'link-12', fromBarId: 'bar-2', toBarId: 'bar-7', routing: 'square', marker: 'arrow' }, // a→c
  {
    id: 'link-13',
    fromBarId: 'bar-5',
    toBarId: 'bar-24',
    routing: 'smooth',
    marker: 'diamond',
    colorOverride: '#8b5cf6',
  }, // b→f with purple
  { id: 'link-14', fromBarId: 'bar-6', toBarId: 'bar-18', routing: 'square', marker: 'arrow' }, // c→b
  {
    id: 'link-15',
    fromBarId: 'bar-8',
    toBarId: 'bar-22',
    routing: 'smooth',
    marker: 'circle-hollow',
    colorOverride: '#f59e0b',
  }, // d→e with orange

  // Links to multi-day bars
  { id: 'link-16', fromBarId: 'bar-17', toBarId: 'bar-25', routing: 'smooth', marker: 'arrow' }, // a→e multi-day
  { id: 'link-17', fromBarId: 'bar-20', toBarId: 'bar-26', routing: 'smooth', marker: 'diamond' }, // d→f multi-day

  // Complex cross-row scenarios
  { id: 'link-18', fromBarId: 'bar-23', toBarId: 'bar-17', routing: 'smooth', marker: 'plus' }, // f→a
  { id: 'link-19', fromBarId: 'bar-19', toBarId: 'bar-21', routing: 'square', marker: 'arrow' }, // c→e
  {
    id: 'link-20',
    fromBarId: 'bar-22',
    toBarId: 'bar-18',
    routing: 'smooth',
    marker: 'circle-hollow',
  }, // e→b
];
