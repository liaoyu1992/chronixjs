<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTree } from '@chronixjs/ui-vue3';

const selected = ref(undefined);
const items = [
  {
    key: 'root-1',
    label: 'Root 1',
    children: [
      { key: 'child-1-1', label: 'Child 1-1' },
      { key: 'child-1-2', label: 'Child 1-2' },
    ],
  },
  {
    key: 'root-2',
    label: 'Root 2',
    children: [{ key: 'child-2-1', label: 'Child 2-1' }],
  },
];
</script>

<template>
  <ChronixTree v-model:value="selected" :items="items" :default-expand-all="true" />
</template>
