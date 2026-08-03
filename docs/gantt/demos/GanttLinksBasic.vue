<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, LinkSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const tasks = [
  { name: '需求分析', start: '2026-01-05', end: '2026-01-12' },
  { name: 'UI 设计', start: '2026-01-12', end: '2026-01-25' },
  { name: '前端开发', start: '2026-01-20', end: '2026-02-10' },
  { name: '后端开发', start: '2026-01-20', end: '2026-02-15' },
  { name: 'API 联调', start: '2026-02-05', end: '2026-02-18' },
  { name: '数据库设计', start: '2026-01-15', end: '2026-01-28' },
  { name: '单元测试', start: '2026-02-10', end: '2026-02-22' },
  { name: '集成测试', start: '2026-02-15', end: '2026-02-28' },
  { name: '性能优化', start: '2026-02-20', end: '2026-03-02' },
  { name: '安全审计', start: '2026-02-22', end: '2026-03-05' },
  { name: '文档编写', start: '2026-02-25', end: '2026-03-05' },
  { name: '部署上线', start: '2026-03-01', end: '2026-03-08' },
  { name: '用户培训', start: '2026-03-05', end: '2026-03-12' },
  { name: '运维监控', start: '2026-03-08', end: '2026-03-15' },
  { name: '版本迭代', start: '2026-03-10', end: '2026-03-22' },
  { name: 'Bug 修复', start: '2026-03-15', end: '2026-03-25' },
  { name: '回归测试', start: '2026-03-20', end: '2026-03-30' },
  { name: '发布评审', start: '2026-03-25', end: '2026-04-02' },
  { name: '项目验收', start: '2026-04-01', end: '2026-04-08' },
  { name: '复盘总结', start: '2026-04-05', end: '2026-04-12' },
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

// Links: chain each task to the next, with some cross-dependencies
const linkDefs: Array<{ from: number; to: number; routing?: 'square' | 'smooth'; color?: string }> =
  [
    { from: 0, to: 1, routing: 'square' },
    { from: 1, to: 2, routing: 'smooth', color: '#ef4444' },
    { from: 1, to: 3, routing: 'square' },
    { from: 2, to: 4, routing: 'smooth' },
    { from: 3, to: 4, routing: 'square', color: '#10b981' },
    { from: 4, to: 6, routing: 'square' },
    { from: 4, to: 7, routing: 'smooth', color: '#ef4444' },
    { from: 6, to: 8, routing: 'square' },
    { from: 7, to: 9, routing: 'smooth' },
    { from: 8, to: 11, routing: 'square', color: '#f59e0b' },
    { from: 9, to: 11, routing: 'smooth' },
    { from: 11, to: 12, routing: 'square' },
    { from: 12, to: 13, routing: 'smooth', color: '#8b5cf6' },
    { from: 13, to: 14, routing: 'square' },
    { from: 14, to: 16, routing: 'smooth' },
    { from: 15, to: 16, routing: 'square', color: '#ef4444' },
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
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
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
