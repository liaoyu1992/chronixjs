<script setup lang="ts">
import { ref } from 'vue';
import { ChronixSelect } from '@chronixjs/ui-vue3';

const selected = ref<string[]>([]);
const options = [
  { key: '1', label: 'Red', value: 'red' },
  { key: '2', label: 'Green', value: 'green' },
  { key: '3', label: 'Blue', value: 'blue' },
  { key: '4', label: 'Yellow', value: 'yellow' },
];
</script>

<template>
  <ChronixSelect
    :options="options"
    v-model:value="selected"
    multiple
    placeholder="Pick several..."
  />
</template>
