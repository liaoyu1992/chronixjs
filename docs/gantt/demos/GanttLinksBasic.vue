<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, LinkSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Design' } },
  { id: 'row-2', columns: { name: 'Develop' } },
  { id: 'row-3', columns: { name: 'Test' } },
];

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    title: 'UI Design',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-12'), end: new Date('2026-01-25') },
    title: 'Frontend',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-3',
    rowId: 'row-3',
    range: { start: new Date('2026-01-25'), end: new Date('2026-02-05') },
    title: 'QA',
    dprIntent: 'crisp-pixel',
  },
];

const links: LinkSpec[] = [
  { id: 'link-1', fromBarId: 'bar-1', toBarId: 'bar-2', routing: 'square', marker: 'arrow' },
  {
    id: 'link-2',
    fromBarId: 'bar-2',
    toBarId: 'bar-3',
    routing: 'smooth',
    marker: 'arrow',
    colorOverride: '#ef4444',
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
    <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :links="links" />
  </div>
</template>
