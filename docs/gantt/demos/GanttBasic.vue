<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const tasks = [
  { name: '需求分析', start: '2026-01-05', end: '2026-01-12' },
  { name: 'UI 设计', start: '2026-01-10', end: '2026-01-22' },
  { name: '交互设计', start: '2026-01-12', end: '2026-01-25' },
  { name: '前端开发', start: '2026-01-18', end: '2026-02-10' },
  { name: '后端开发', start: '2026-01-18', end: '2026-02-15' },
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
  { name: '版本迭代', start: '2026-03-10', end: '2026-03-20' },
  { name: 'Bug 修复', start: '2026-03-15', end: '2026-03-25' },
  { name: '回归测试', start: '2026-03-20', end: '2026-03-30' },
  { name: '发布评审', start: '2026-03-25', end: '2026-04-02' },
  { name: '项目验收', start: '2026-04-01', end: '2026-04-08' },
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
    <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" />
  </div>
</template>
