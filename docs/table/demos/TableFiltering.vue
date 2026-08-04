<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: '姓名', filterable: true, filterUi: 'text', width: 180 },
  {
    id: 'status',
    field: 'status',
    headerName: '状态',
    filterable: true,
    filterUi: 'set',
    width: 120,
  },
  {
    id: 'score',
    field: 'score',
    headerName: '分数',
    filterable: true,
    filterUi: 'text',
    width: 100,
    type: 'number',
  },
  { id: 'dept', field: 'dept', headerName: '部门', filterable: true, filterUi: 'set', width: 150 },
  { id: 'city', field: 'city', headerName: '城市', flex: 1 },
];

const statuses = ['在职', '离职', '试用期', '休假'];
const depts = ['研发部', '设计部', '产品部', '测试部', '运维部'];
const cities = ['北京', '上海', '深圳', '杭州', '广州', '成都', '武汉', '南京'];
const names = [
  '张伟',
  '王芳',
  '李娜',
  '刘洋',
  '陈静',
  '杨磊',
  '赵敏',
  '黄涛',
  '周婷',
  '吴昊',
  '徐丽',
  '孙鹏',
  '马超',
  '朱琳',
  '胡军',
  '郭蓉',
  '林峰',
  '何洁',
  '高峰',
  '罗丹',
];

const rows: RowSpec[] = names.map((name, i) => ({
  id: String(i + 1),
  data: {
    name,
    status: statuses[i % statuses.length],
    score: 60 + ((i * 7) % 40),
    dept: depts[i % depts.length],
    city: cities[i % cities.length],
  },
}));
</script>

<template>
  <div style="height: calc(100vh - 200px); min-height: 500px">
    <ChronixTable :columns="columns" :rows="rows" :show-filter-row="true" />
  </div>
</template>
