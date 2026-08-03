<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, LinkSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const tasks = [
  { name: '需求分析', start: '2026-01-05', end: '2026-01-25' },
  { name: 'UI 设计', start: '2026-01-20', end: '2026-02-15' },
  { name: '交互设计', start: '2026-02-01', end: '2026-02-28' },
  { name: '前端开发', start: '2026-02-15', end: '2026-05-30' },
  { name: '后端开发', start: '2026-02-15', end: '2026-06-15' },
  { name: 'API 联调', start: '2026-04-01', end: '2026-05-15' },
  { name: '数据库设计', start: '2026-01-15', end: '2026-03-01' },
  { name: '单元测试', start: '2026-05-01', end: '2026-06-15' },
  { name: '集成测试', start: '2026-06-01', end: '2026-07-15' },
  { name: '性能优化', start: '2026-07-01', end: '2026-08-15' },
  { name: '安全审计', start: '2026-08-01', end: '2026-09-01' },
  { name: '文档编写', start: '2026-08-15', end: '2026-09-30' },
  { name: '部署上线', start: '2026-09-15', end: '2026-10-01' },
  { name: '用户培训', start: '2026-10-01', end: '2026-10-15' },
  { name: '运维监控', start: '2026-10-01', end: '2026-12-31' },
  { name: '版本迭代', start: '2026-10-15', end: '2026-11-30' },
  { name: 'Bug 修复', start: '2026-11-01', end: '2026-11-30' },
  { name: '回归测试', start: '2026-11-15', end: '2026-12-15' },
  { name: '发布评审', start: '2026-12-01', end: '2026-12-15' },
  { name: '项目验收', start: '2026-12-15', end: '2026-12-31' },
];

const rows: RowSpec[] = tasks.map((t, i) => ({
  id: `row-${i + 1}`,
  columns: { name: t.name },
}));

const bars: BarSpec[] = tasks.map((t, i) => ({
  id: `bar-${i + 1}`,
  rowId: `row-${i + 1}`,
  range: { start: new Date(t.start), end: new Date(t.end) },
  title: t.name,
  dprIntent: 'crisp-pixel' as const,
}));

// Links: chain tasks across the full year, with cross-dependencies
const linkDefs: Array<{ from: number; to: number; routing?: 'square' | 'smooth'; color?: string }> =
  [
    { from: 0, to: 1, routing: 'square' },
    { from: 1, to: 2, routing: 'smooth', color: '#ef4444' },
    { from: 1, to: 3, routing: 'square' },
    { from: 2, to: 4, routing: 'smooth' },
    { from: 3, to: 5, routing: 'square', color: '#10b981' },
    { from: 4, to: 5, routing: 'smooth', color: '#ef4444' },
    { from: 5, to: 7, routing: 'square' },
    { from: 5, to: 8, routing: 'smooth', color: '#ef4444' },
    { from: 7, to: 9, routing: 'square' },
    { from: 8, to: 10, routing: 'smooth' },
    { from: 9, to: 12, routing: 'square', color: '#f59e0b' },
    { from: 10, to: 12, routing: 'smooth' },
    { from: 12, to: 13, routing: 'square' },
    { from: 12, to: 14, routing: 'smooth', color: '#8b5cf6' },
    { from: 13, to: 15, routing: 'square' },
    { from: 15, to: 16, routing: 'smooth' },
    { from: 15, to: 17, routing: 'square', color: '#ef4444' },
    { from: 16, to: 18, routing: 'smooth', color: '#10b981' },
    { from: 17, to: 18, routing: 'square' },
    { from: 18, to: 19, routing: 'smooth' },
  ];

const links: LinkSpec[] = linkDefs.map((l, i) => ({
  id: `link-${i + 1}`,
  fromBarId: `bar-${l.from + 1}`,
  toBarId: `bar-${l.to + 1}`,
  routing: l.routing ?? 'square',
  marker: 'arrow',
  ...(l.color ? { colorOverride: l.color } : {}),
}));

const axisInput: AxisRangePlanInput = {
  viewId: 'year',
  anchorDate: new Date('2026-01-01'),
  viewportWidth: 1200,
  locale: 'en',
  weekendsVisible: true,
};
</script>

<template>
  <div style="height: calc(100vh - 200px); min-height: 500px">
    <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :links="links" />
  </div>
</template>
