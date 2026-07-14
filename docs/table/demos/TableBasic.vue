<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';

const columns = [
  { id: 'name', field: 'name', headerName: 'Name', width: 200, sortable: true },
  { id: 'email', field: 'email', headerName: 'Email', width: 300 },
  { id: 'role', field: 'role', headerName: 'Role', width: 150, sortable: true },
];

const rows = [
  { id: '1', data: { name: 'Alice', email: 'alice@example.com', role: 'Engineer' } },
  { id: '2', data: { name: 'Bob', email: 'bob@example.com', role: 'Designer' } },
  { id: '3', data: { name: 'Carol', email: 'carol@example.com', role: 'Manager' } },
  { id: '4', data: { name: 'Dave', email: 'dave@example.com', role: 'Engineer' } },
  { id: '5', data: { name: 'Eve', email: 'eve@example.com', role: 'Designer' } },
];
</script>

<template>
  <div style="height: 300px">
    <ChronixTable :columns="columns" :rows="rows" />
  </div>
</template>
