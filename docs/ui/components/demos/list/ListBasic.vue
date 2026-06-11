<script setup lang="ts">
import { ref } from 'vue';
import { ChronixList } from '@chronixjs/ui-vue3';

const items = ref([
  { key: '1', title: 'Item 1' },
  { key: '2', title: 'Item 2' },
  { key: '3', title: 'Item 3' },
]);
</script>

<template>
  <ChronixList :items="items" bordered />
</template>
