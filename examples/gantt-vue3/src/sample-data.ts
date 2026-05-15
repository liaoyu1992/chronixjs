import type { BarSpec, RowSpec } from '@chronixjs/gantt';

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
];

export const sampleBars: readonly BarSpec[] = [
  // Today's hour-scale bars — day view shows these in detail.
  barAt('bar-1', 'workshop-a', 1, 5, '设备维护 - 起点'),
  barAt('bar-2', 'workshop-a', 8, 12, '系统检查', 50),
  barAt('bar-3', 'workshop-a', 15, 22, '夜间检修'),
  barAt('bar-4', 'workshop-b', 2, 7, '日常巡检'),
  barAt('bar-5', 'workshop-b', 10, 18, '主要维护', 25),
  barAt('bar-6', 'workshop-c', 6, 14, '部件更换'),
  barAt('bar-7', 'workshop-c', 16, 20, '验证测试'),
  barAt('bar-8', 'workshop-d', 4, 11, '综合检修', 80),

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
];
