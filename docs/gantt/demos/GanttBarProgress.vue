<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const tasks = [
  // Q1 — 已完成 (indigo)
  {
    name: '需求分析',
    start: '2026-01-05',
    end: '2026-01-25',
    progress: 100,
    color: '#6366f1',
    border: '#4f46e5',
  },
  {
    name: 'UI 设计',
    start: '2026-01-20',
    end: '2026-02-15',
    progress: 100,
    color: '#6366f1',
    border: '#4f46e5',
  },
  {
    name: '交互设计',
    start: '2026-02-01',
    end: '2026-02-28',
    progress: 100,
    color: '#6366f1',
    border: '#4f46e5',
  },
  {
    name: '数据库设计',
    start: '2026-01-15',
    end: '2026-03-01',
    progress: 100,
    color: '#6366f1',
    border: '#4f46e5',
  },
  // Q2 — 进行中 (blue)
  {
    name: '前端开发',
    start: '2026-02-15',
    end: '2026-05-30',
    progress: 85,
    color: '#3b82f6',
    border: '#2563eb',
  },
  {
    name: '后端开发',
    start: '2026-02-15',
    end: '2026-06-15',
    progress: 70,
    color: '#3b82f6',
    border: '#2563eb',
  },
  {
    name: 'API 联调',
    start: '2026-04-01',
    end: '2026-05-15',
    progress: 50,
    color: '#3b82f6',
    border: '#2563eb',
  },
  {
    name: '单元测试',
    start: '2026-05-01',
    end: '2026-06-15',
    progress: 30,
    color: '#3b82f6',
    border: '#2563eb',
  },
  // Q3 — 刚启动 (amber)
  {
    name: '集成测试',
    start: '2026-06-01',
    end: '2026-07-15',
    progress: 15,
    color: '#f59e0b',
    border: '#d97706',
  },
  {
    name: '性能优化',
    start: '2026-07-01',
    end: '2026-08-15',
    progress: 5,
    color: '#f59e0b',
    border: '#d97706',
  },
  {
    name: '安全审计',
    start: '2026-08-01',
    end: '2026-09-01',
    progress: 0,
    color: '#f59e0b',
    border: '#d97706',
  },
  {
    name: '文档编写',
    start: '2026-08-15',
    end: '2026-09-30',
    progress: 0,
    color: '#f59e0b',
    border: '#d97706',
  },
  // Q4 — 未开始 (red)
  {
    name: '部署上线',
    start: '2026-09-15',
    end: '2026-10-01',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  {
    name: '用户培训',
    start: '2026-10-01',
    end: '2026-10-15',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  {
    name: '运维监控',
    start: '2026-10-01',
    end: '2026-12-31',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  {
    name: '版本迭代',
    start: '2026-10-15',
    end: '2026-11-30',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  {
    name: 'Bug 修复',
    start: '2026-11-01',
    end: '2026-11-30',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  {
    name: '回归测试',
    start: '2026-11-15',
    end: '2026-12-15',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  {
    name: '发布评审',
    start: '2026-12-01',
    end: '2026-12-15',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
  {
    name: '项目验收',
    start: '2026-12-15',
    end: '2026-12-31',
    progress: 0,
    color: '#ef4444',
    border: '#dc2626',
  },
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
  viewId: 'year',
  anchorDate: new Date('2026-01-01'),
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
