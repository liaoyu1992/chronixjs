import type { BarSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

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

export const sampleRows: readonly RowSpec[] = [
  { id: 'workshop-a', columns: { name: '车间 A' } },
  { id: 'workshop-b', columns: { name: '车间 B' } },
  { id: 'workshop-c', columns: { name: '车间 C' } },
  { id: 'workshop-d', columns: { name: '车间 D' } },
];

export const sampleBars: readonly BarSpec[] = [
  barAt('bar-1', 'workshop-a', 1, 5, '设备维护 - 起点'),
  barAt('bar-2', 'workshop-a', 8, 12, '系统检查', 50),
  barAt('bar-3', 'workshop-a', 15, 22, '夜间检修'),
  barAt('bar-4', 'workshop-b', 2, 7, '日常巡检'),
  barAt('bar-5', 'workshop-b', 10, 18, '主要维护', 25),
  barAt('bar-6', 'workshop-c', 6, 14, '部件更换'),
  barAt('bar-7', 'workshop-c', 16, 20, '验证测试'),
  barAt('bar-8', 'workshop-d', 4, 11, '综合检修', 80),
];
