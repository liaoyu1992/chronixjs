<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ColumnSpec, RowSpec } from '@chronixjs/table';

const columns: ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name', sortable: true, width: 200 },
  { id: 'age', field: 'age', headerName: 'Age', sortable: true, width: 100, type: 'number' },
  { id: 'email', field: 'email', headerName: 'Email', width: 300 },
];

const rows: RowSpec[] = [
  { id: '1', data: { name: 'Charlie', age: 35, email: 'charlie@example.com' } },
  { id: '2', data: { name: 'Alice', age: 28, email: 'alice@example.com' } },
  { id: '3', data: { name: 'Bob', age: 32, email: 'bob@example.com' } },
  { id: '4', data: { name: 'Diana', age: 24, email: 'diana@example.com' } },
  { id: '5', data: { name: 'Evan', age: 41, email: 'evan@example.com' } },
  { id: '6', data: { name: 'Fiona', age: 29, email: 'fiona@example.com' } },
  { id: '7', data: { name: 'George', age: 37, email: 'george@example.com' } },
  { id: '8', data: { name: 'Helen', age: 26, email: 'helen@example.com' } },
];
</script>

<template>
  <div style="height: 320px">
    <ChronixTable :columns="columns" :rows="rows" :enable-keyboard-navigation="true" />
  </div>
</template>
