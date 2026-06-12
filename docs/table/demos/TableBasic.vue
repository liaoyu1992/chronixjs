<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';

const columns = [
  { key: 'name', title: 'Name', width: 200, sortable: true },
  { key: 'email', title: 'Email', width: 300 },
  { key: 'role', title: 'Role', width: 150, sortable: true },
];

const rows = [
  { name: 'Alice', email: 'alice@example.com', role: 'Engineer' },
  { name: 'Bob', email: 'bob@example.com', role: 'Designer' },
  { name: 'Carol', email: 'carol@example.com', role: 'Manager' },
  { name: 'Dave', email: 'dave@example.com', role: 'Engineer' },
  { name: 'Eve', email: 'eve@example.com', role: 'Designer' },
];
</script>

<template>
  <div style="height: 300px">
    <ChronixTable :columns="columns" :rows="rows" />
  </div>
</template>
