<script setup lang="ts">
import { ref } from 'vue';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput, ToolbarInput } from '@chronixjs/gantt';

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
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-10'), end: new Date('2026-01-22') },
    title: 'Design',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-3',
    rowId: 'row-3',
    range: { start: new Date('2026-01-18'), end: new Date('2026-02-10') },
    title: 'Development',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-4',
    rowId: 'row-4',
    range: { start: new Date('2026-02-05'), end: new Date('2026-02-18') },
    title: 'Testing',
    dprIntent: 'crisp-pixel',
  },
];

const axisInput = ref<AxisRangePlanInput>({
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 800,
  locale: 'en',
  weekendsVisible: true,
});

const toolbar: ToolbarInput = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,year',
};

function onAxisChange(next: AxisRangePlanInput) {
  axisInput.value = next;
}
</script>

<template>
  <div style="height: 400px">
    <ChronixGantt
      :bars="bars"
      :rows="rows"
      :axis-input="axisInput"
      :header-toolbar="toolbar"
      @update:axis-input="onAxisChange"
    />
  </div>
</template>
