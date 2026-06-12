<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTreeSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);
const treeData = [
  {
    key: 'node1',
    label: 'Node 1',
    children: [
      { key: 'node1-1', label: 'Node 1-1' },
      { key: 'node1-2', label: 'Node 1-2' },
    ],
  },
  {
    key: 'node2',
    label: 'Node 2',
    children: [{ key: 'node2-1', label: 'Node 2-1' }],
  },
];
</script>

<template>
  <ChronixTreeSelect :data="treeData" v-model:value="selected" placeholder="Select..." />
</template>
