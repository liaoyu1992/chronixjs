<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const tasks = [
  {
    name: '项目立项',
    start: '2026-01-05',
    end: '2026-01-12',
    progress: 100,
    color: '#6366f1',
    border: '#4f46e5',
  },
  {
    name: '需求分析',
    start: '2026-01-08',
    end: '2026-01-18',
    progress: 100,
    color: '#6366f1',
    border: '#4f46e5',
  },
  {
    name: 'UI 设计',
    start: '2026-01-12',
    end: '2026-01-25',
    progress: 90,
    color: '#8b5cf6',
    border: '#7c3aed',
  },
  {
    name: '前端开发',
    start: '2026-01-20',
    end: '2026-02-10',
    progress: 65,
    color: '#3b82f6',
    border: '#2563eb',
  },
  {
    name: '后端开发',
    start: '2026-01-20',
    end: '2026-02-15',
    progress: 55,
    color: '#3b82f6',
    border: '#2563eb',
  },
  {
    name: 'API 联调',
    start: '2026-02-05',
    end: '2026-02-18',
    progress: 30,
    color: '#10b981',
    border: '#059669',
  },
  {
    name: '数据库设计',
    start: '2026-01-15',
    end: '2026-01-28',
    progress: 100,
    color: '#6366f1',
    border: '#4f46e5',
  },
  {
    name: '单元测试',
    start: '2026-02-10',
    end: '2026-02-22',
    progress: 20,
    color: '#f59e0b',
    border: '#d97706',
  },
  {
    name: '集成测试',
    start: '2026-02-15',
    end: '2026-02-28',
    progress: 10,
    color: '#f59e0b',
    border: '#d97706',
  },
  {
    name: '性能优化',
    start: '2026-02-20',
    end: '2026-03-02',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  {
    name: '安全审计',
    start: '2026-02-22',
    end: '2026-03-05',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  { name: '文档编写', start: '2026-02-25', end: '2026-03-05', progress: 0 },
  { name: '部署上线', start: '2026-03-01', end: '2026-03-08', progress: 0 },
  { name: '用户培训', start: '2026-03-05', end: '2026-03-12', progress: 0 },
  { name: '运维监控', start: '2026-03-08', end: '2026-03-15', progress: 0 },
  { name: '版本迭代', start: '2026-03-10', end: '2026-03-22', progress: 0 },
  { name: 'Bug 修复', start: '2026-03-15', end: '2026-03-25', progress: 0 },
  { name: '回归测试', start: '2026-03-20', end: '2026-03-30', progress: 0 },
  { name: '发布评审', start: '2026-03-25', end: '2026-04-02', progress: 0 },
  { name: '项目验收', start: '2026-04-01', end: '2026-04-08', progress: 0 },
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
  ...(t.progress > 0 ? { progress: { value: t.progress, showText: true } } : {}),
  ...(t.color ? { style: { backgroundColor: t.color, borderColor: t.border } } : {}),
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
