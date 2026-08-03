<script setup lang="ts">
import { ref } from 'vue';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput, ToolbarInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: '项目立项' } },
  { id: 'row-2', columns: { name: '需求分析' } },
  { id: 'row-3', columns: { name: 'UI 设计' } },
  { id: 'row-4', columns: { name: '前端开发' } },
  { id: 'row-5', columns: { name: '后端开发' } },
  { id: 'row-6', columns: { name: 'API 联调' } },
  { id: 'row-7', columns: { name: '数据库设计' } },
  { id: 'row-8', columns: { name: '单元测试' } },
  { id: 'row-9', columns: { name: '集成测试' } },
  { id: 'row-10', columns: { name: '性能优化' } },
  { id: 'row-11', columns: { name: '安全审计' } },
  { id: 'row-12', columns: { name: '部署上线' } },
  { id: 'row-13', columns: { name: '用户培训' } },
  { id: 'row-14', columns: { name: '运维监控' } },
];

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    title: '项目立项',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-08'), end: new Date('2026-01-18') },
    title: '需求分析',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-3',
    rowId: 'row-3',
    range: { start: new Date('2026-01-15'), end: new Date('2026-01-28') },
    title: 'UI 设计',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-4',
    rowId: 'row-4',
    range: { start: new Date('2026-01-22'), end: new Date('2026-02-15') },
    title: '前端开发',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-5',
    rowId: 'row-5',
    range: { start: new Date('2026-01-22'), end: new Date('2026-02-20') },
    title: '后端开发',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-6',
    rowId: 'row-6',
    range: { start: new Date('2026-02-05'), end: new Date('2026-02-18') },
    title: 'API 联调',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-7',
    rowId: 'row-7',
    range: { start: new Date('2026-01-18'), end: new Date('2026-01-30') },
    title: '数据库设计',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-8',
    rowId: 'row-8',
    range: { start: new Date('2026-02-10'), end: new Date('2026-02-25') },
    title: '单元测试',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-9',
    rowId: 'row-9',
    range: { start: new Date('2026-02-15'), end: new Date('2026-02-28') },
    title: '集成测试',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-10',
    rowId: 'row-10',
    range: { start: new Date('2026-02-20'), end: new Date('2026-03-02') },
    title: '性能优化',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-11',
    rowId: 'row-11',
    range: { start: new Date('2026-02-22'), end: new Date('2026-03-05') },
    title: '安全审计',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-12',
    rowId: 'row-12',
    range: { start: new Date('2026-02-28'), end: new Date('2026-03-08') },
    title: '部署上线',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-13',
    rowId: 'row-13',
    range: { start: new Date('2026-03-05'), end: new Date('2026-03-12') },
    title: '用户培训',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-14',
    rowId: 'row-14',
    range: { start: new Date('2026-03-08'), end: new Date('2026-03-15') },
    title: '运维监控',
    dprIntent: 'crisp-pixel',
  },
];

const axisInput = ref<AxisRangePlanInput>({
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 1200,
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
  <div style="height: 600px">
    <ChronixGantt
      :bars="bars"
      :rows="rows"
      :axis-input="axisInput"
      :header-toolbar="toolbar"
      @update:axis-input="onAxisChange"
    />
  </div>
</template>
