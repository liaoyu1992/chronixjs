<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: '名称', flex: 2, treeColumn: true },
  { id: 'type', field: 'type', headerName: '类型', width: 100 },
  { id: 'size', field: 'size', headerName: '大小 (B)', width: 120, type: 'number' },
  { id: 'modified', field: 'modified', headerName: '修改时间', flex: 1 },
];

const rows: RowSpec[] = [
  {
    id: 'project-a',
    data: { name: 'chronix-table', type: 'project', size: 12480, modified: '2026-01-15' },
    children: [
      {
        id: 'project-a/core',
        data: { name: 'core', type: 'module', size: 8200, modified: '2026-01-10' },
        children: [
          {
            id: 'project-a/core/index',
            data: { name: 'index.ts', type: 'file', size: 1200, modified: '2026-01-08' },
          },
          {
            id: 'project-a/core/utils',
            data: { name: 'utils.ts', type: 'file', size: 3400, modified: '2026-01-09' },
          },
          {
            id: 'project-a/core/types',
            data: { name: 'types.ts', type: 'file', size: 3600, modified: '2026-01-10' },
          },
        ],
      },
      {
        id: 'project-a/adapters',
        data: { name: 'adapters', type: 'module', size: 4280, modified: '2026-01-12' },
        children: [
          {
            id: 'project-a/adapters/vue3',
            data: { name: 'vue3.ts', type: 'file', size: 2100, modified: '2026-01-11' },
          },
          {
            id: 'project-a/adapters/react',
            data: { name: 'react.ts', type: 'file', size: 2180, modified: '2026-01-12' },
          },
        ],
      },
      {
        id: 'project-a/tests',
        data: { name: 'tests', type: 'module', size: 5200, modified: '2026-01-14' },
        children: [
          {
            id: 'project-a/tests/unit',
            data: { name: 'unit.test.ts', type: 'file', size: 2800, modified: '2026-01-13' },
          },
          {
            id: 'project-a/tests/integration',
            data: { name: 'integration.test.ts', type: 'file', size: 2400, modified: '2026-01-14' },
          },
        ],
      },
    ],
  },
  {
    id: 'project-b',
    data: { name: 'chronix-gantt', type: 'project', size: 9600, modified: '2026-01-15' },
    children: [
      {
        id: 'project-b/core',
        data: { name: 'core', type: 'module', size: 9600, modified: '2026-01-15' },
        children: [
          {
            id: 'project-b/core/axis',
            data: { name: 'axis.ts', type: 'file', size: 4800, modified: '2026-01-14' },
          },
          {
            id: 'project-b/core/bars',
            data: { name: 'bars.ts', type: 'file', size: 4800, modified: '2026-01-15' },
          },
        ],
      },
    ],
  },
  {
    id: 'project-c',
    data: { name: 'chronix-ui', type: 'project', size: 15600, modified: '2026-01-16' },
    children: [
      {
        id: 'project-c/components',
        data: { name: 'components', type: 'module', size: 15600, modified: '2026-01-16' },
        children: [
          {
            id: 'project-c/components/button',
            data: { name: 'Button.vue', type: 'file', size: 3200, modified: '2026-01-15' },
          },
          {
            id: 'project-c/components/input',
            data: { name: 'Input.vue', type: 'file', size: 2800, modified: '2026-01-16' },
          },
          {
            id: 'project-c/components/dialog',
            data: { name: 'Dialog.vue', type: 'file', size: 4600, modified: '2026-01-16' },
          },
          {
            id: 'project-c/components/table',
            data: { name: 'Table.vue', type: 'file', size: 5000, modified: '2026-01-16' },
          },
        ],
      },
    ],
  },
];
</script>

<template>
  <div style="height: calc(100vh - 200px); min-height: 500px">
    <ChronixTable :columns="columns" :rows="rows" :default-expanded-depth="1" />
  </div>
</template>
