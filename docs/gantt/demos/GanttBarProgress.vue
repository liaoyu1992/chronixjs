<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Planning' } },
  { id: 'row-2', columns: { name: 'Design' } },
  { id: 'row-3', columns: { name: 'Development' } },
  { id: 'row-4', columns: { name: 'Testing' } },
];

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    title: 'Planning',
    dprIntent: 'crisp-pixel',
    progress: { value: 100, showText: true },
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-10'), end: new Date('2026-01-22') },
    title: 'UI Design',
    dprIntent: 'crisp-pixel',
    progress: { value: 65, showText: true },
    style: { backgroundColor: '#8b5cf6', borderColor: '#7c3aed' },
  },
  {
    id: 'bar-3',
    rowId: 'row-3',
    range: { start: new Date('2026-01-18'), end: new Date('2026-02-05') },
    title: 'Frontend',
    dprIntent: 'crisp-pixel',
    progress: { value: 30, showText: true },
    style: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
  },
  {
    id: 'bar-4',
    rowId: 'row-4',
    range: { start: new Date('2026-02-01'), end: new Date('2026-02-12') },
    title: 'QA',
    dprIntent: 'crisp-pixel',
    style: { backgroundColor: '#f97316', borderColor: '#ea580c' },
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
  <div style="height: 350px">
    <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" />
  </div>
</template>
