<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left', sortable: true },
  {
    id: 'name',
    field: 'name',
    headerName: '名称',
    width: 140,
    sortable: true,
    pinned: 'left',
    filterable: true,
    filterUi: 'text',
  },
  {
    id: 'status',
    field: 'status',
    headerName: '状态',
    width: 100,
    sortable: true,
    filterable: true,
    filterUi: 'set',
    cellClass: ({ value }) => `cx-status--${String(value)}`,
  },
  { id: 'qty', field: 'qty', headerName: '数量', width: 100, type: 'number', sortable: true },
  {
    id: 'price',
    field: 'price',
    headerName: '单价',
    width: 100,
    type: 'number',
    editable: true,
    sortable: true,
  },
  { id: 'note', field: 'note', headerName: '备注', flex: 1, editable: true, pinned: 'right' },
];

const rows: RowSpec[] = Array.from({ length: 50 }, (_, i) => {
  const idx = i + 1;
  const statuses = ['计划', '进行中', '完成', '阻塞'];
  const names = [
    '需求评审',
    '架构设计',
    '原型联调',
    '后端实现',
    '前端落地',
    '联调测试',
    '性能优化',
    '文档撰写',
  ];
  return {
    id: `r${idx}`,
    data: {
      id: idx,
      name: names[i % names.length],
      status: statuses[i % statuses.length],
      qty: (idx * 7) % 50,
      price: Math.round(((idx * 13) % 100) * 10 + 99) / 10,
      note: idx % 3 === 0 ? '需关注' : '',
    },
  };
});
</script>

<template>
  <div style="height: calc(100vh - 200px); min-height: 500px">
    <ChronixTable
      :columns="columns"
      :rows="rows"
      :show-filter-row="true"
      :show-pagination="true"
      :initial-page-size="10"
      selection-mode="multi"
      :selection-column="{ show: true, side: 'left' }"
      :enable-keyboard-navigation="true"
    />
  </div>
</template>
