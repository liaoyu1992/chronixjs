<script setup lang="ts">
import { ref } from 'vue';
import { ChronixSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);
const options = [
  { key: '1', label: 'Option A', value: 'a' },
  { key: '2', label: 'Option B', value: 'b' },
  { key: '3', label: 'Option C', value: 'c' },
];
</script>

<template>
  <ChronixSelect :options="options" v-model:value="selected" placeholder="Select..." />
</template>
