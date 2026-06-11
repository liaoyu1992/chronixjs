<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTransfer } from '@chronixjs/ui-vue3';

const targetValues = ref<(string | number)[]>([]);
const options = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
  { label: 'Option 4', value: '4' },
  { label: 'Option 5', value: '5' },
];
</script>

<template>
  <ChronixTransfer :options="options" v-model:value="targetValues" />
</template>
