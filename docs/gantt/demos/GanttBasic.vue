<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Design' } },
  { id: 'row-2', columns: { name: 'Development' } },
  { id: 'row-3', columns: { name: 'Testing' } },
];

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-15') },
    title: 'UI Design',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-12'), end: new Date('2026-01-28') },
    title: 'Frontend Dev',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-3',
    rowId: 'row-3',
    range: { start: new Date('2026-01-25'), end: new Date('2026-02-05') },
    title: 'QA Testing',
    dprIntent: 'crisp-pixel',
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 800,
  locale: 'en',
  weekendsVisible: true,
};
</script>

<template>
  <div style="height: 300px">
    <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" />
  </div>
</template>
