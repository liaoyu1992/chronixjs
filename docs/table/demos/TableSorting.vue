<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: '姓名', sortable: true, width: 200 },
  { id: 'age', field: 'age', headerName: '年龄', sortable: true, width: 100, type: 'number' },
  { id: 'email', field: 'email', headerName: '邮箱', width: 300 },
  { id: 'dept', field: 'dept', headerName: '部门', sortable: true, width: 150 },
  { id: 'city', field: 'city', headerName: '城市', sortable: true, flex: 1 },
];

const data = [
  { name: 'Charlie', age: 35, email: 'charlie@example.com', dept: '研发部', city: '北京' },
  { name: 'Alice', age: 28, email: 'alice@example.com', dept: '设计部', city: '上海' },
  { name: 'Bob', age: 32, email: 'bob@example.com', dept: '产品部', city: '深圳' },
  { name: 'Diana', age: 24, email: 'diana@example.com', dept: '测试部', city: '杭州' },
  { name: 'Evan', age: 41, email: 'evan@example.com', dept: '研发部', city: '广州' },
  { name: 'Fiona', age: 29, email: 'fiona@example.com', dept: '设计部', city: '成都' },
  { name: 'George', age: 37, email: 'george@example.com', dept: '运维部', city: '武汉' },
  { name: 'Helen', age: 26, email: 'helen@example.com', dept: '产品部', city: '南京' },
  { name: 'Ivan', age: 33, email: 'ivan@example.com', dept: '研发部', city: '北京' },
  { name: 'Jane', age: 31, email: 'jane@example.com', dept: '测试部', city: '上海' },
  { name: 'Kevin', age: 45, email: 'kevin@example.com', dept: '运维部', city: '深圳' },
  { name: 'Lily', age: 27, email: 'lily@example.com', dept: '设计部', city: '杭州' },
  { name: 'Mike', age: 38, email: 'mike@example.com', dept: '研发部', city: '广州' },
  { name: 'Nancy', age: 30, email: 'nancy@example.com', dept: '产品部', city: '成都' },
  { name: 'Oliver', age: 34, email: 'oliver@example.com', dept: '测试部', city: '武汉' },
  { name: 'Penny', age: 25, email: 'penny@example.com', dept: '设计部', city: '南京' },
  { name: 'Quinn', age: 42, email: 'quinn@example.com', dept: '运维部', city: '北京' },
  { name: 'Rachel', age: 29, email: 'rachel@example.com', dept: '研发部', city: '上海' },
  { name: 'Sam', age: 36, email: 'sam@example.com', dept: '产品部', city: '深圳' },
  { name: 'Tina', age: 28, email: 'tina@example.com', dept: '测试部', city: '杭州' },
];

const rows: RowSpec[] = data.map((d, i) => ({ id: String(i + 1), data: d }));
</script>

<template>
  <div style="height: calc(100vh - 200px); min-height: 500px">
    <ChronixTable :columns="columns" :rows="rows" :enable-keyboard-navigation="true" />
  </div>
</template>
