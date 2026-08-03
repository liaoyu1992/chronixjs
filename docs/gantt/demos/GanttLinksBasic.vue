<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, LinkSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: '需求分析' } },
  { id: 'row-2', columns: { name: 'UI 设计' } },
  { id: 'row-3', columns: { name: '前端开发' } },
  { id: 'row-4', columns: { name: '后端开发' } },
  { id: 'row-5', columns: { name: 'API 联调' } },
  { id: 'row-6', columns: { name: '数据库设计' } },
  { id: 'row-7', columns: { name: '单元测试' } },
  { id: 'row-8', columns: { name: '集成测试' } },
  { id: 'row-9', columns: { name: '性能优化' } },
  { id: 'row-10', columns: { name: '安全审计' } },
  { id: 'row-11', columns: { name: '文档编写' } },
  { id: 'row-12', columns: { name: '部署上线' } },
  { id: 'row-13', columns: { name: '用户培训' } },
  { id: 'row-14', columns: { name: '运维监控' } },
];

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    title: '需求分析',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-12'), end: new Date('2026-01-25') },
    title: 'UI 设计',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-3',
    rowId: 'row-3',
    range: { start: new Date('2026-01-20'), end: new Date('2026-02-10') },
    title: '前端开发',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-4',
    rowId: 'row-4',
    range: { start: new Date('2026-01-20'), end: new Date('2026-02-15') },
    title: '后端开发',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-5',
    rowId: 'row-5',
    range: { start: new Date('2026-02-05'), end: new Date('2026-02-18') },
    title: 'API 联调',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-6',
    rowId: 'row-6',
    range: { start: new Date('2026-01-15'), end: new Date('2026-01-28') },
    title: '数据库设计',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-7',
    rowId: 'row-7',
    range: { start: new Date('2026-02-10'), end: new Date('2026-02-22') },
    title: '单元测试',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-8',
    rowId: 'row-8',
    range: { start: new Date('2026-02-15'), end: new Date('2026-02-28') },
    title: '集成测试',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-9',
    rowId: 'row-9',
    range: { start: new Date('2026-02-20'), end: new Date('2026-03-02') },
    title: '性能优化',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-10',
    rowId: 'row-10',
    range: { start: new Date('2026-02-22'), end: new Date('2026-03-05') },
    title: '安全审计',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-11',
    rowId: 'row-11',
    range: { start: new Date('2026-02-25'), end: new Date('2026-03-05') },
    title: '文档编写',
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-12',
    rowId: 'row-12',
    range: { start: new Date('2026-03-01'), end: new Date('2026-03-08') },
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
  { id: 'link-3', fromBarId: 'bar-2', toBarId: 'bar-4', routing: 'square', marker: 'arrow' },
  { id: 'link-4', fromBarId: 'bar-3', toBarId: 'bar-5', routing: 'smooth', marker: 'arrow' },
  {
    id: 'link-5',
    fromBarId: 'bar-4',
    toBarId: 'bar-5',
    routing: 'square',
    marker: 'arrow',
    colorOverride: '#10b981',
  },
  { id: 'link-6', fromBarId: 'bar-5', toBarId: 'bar-7', routing: 'square', marker: 'arrow' },
  {
    id: 'link-7',
    fromBarId: 'bar-5',
    toBarId: 'bar-8',
    routing: 'smooth',
    marker: 'arrow',
    colorOverride: '#ef4444',
  },
  { id: 'link-8', fromBarId: 'bar-7', toBarId: 'bar-9', routing: 'square', marker: 'arrow' },
  { id: 'link-9', fromBarId: 'bar-8', toBarId: 'bar-10', routing: 'smooth', marker: 'arrow' },
  {
    id: 'link-10',
    fromBarId: 'bar-9',
    toBarId: 'bar-12',
    routing: 'square',
    marker: 'arrow',
    colorOverride: '#f59e0b',
  },
  { id: 'link-11', fromBarId: 'bar-10', toBarId: 'bar-12', routing: 'smooth', marker: 'arrow' },
  { id: 'link-12', fromBarId: 'bar-12', toBarId: 'bar-13', routing: 'square', marker: 'arrow' },
  {
    id: 'link-13',
    fromBarId: 'bar-13',
    toBarId: 'bar-14',
    routing: 'smooth',
    marker: 'arrow',
    colorOverride: '#8b5cf6',
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 1200,
  locale: 'en',
  weekendsVisible: true,
};
</script>

<template>
  <div style="height: 600px">
    <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :links="links" />
  </div>
</template>
