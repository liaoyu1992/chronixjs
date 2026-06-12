<script setup lang="ts">
import { ref } from 'vue';
import { ChronixAutoComplete } from '@chronixjs/ui-vue3';

const value = ref('');
const options = [
  { key: 'apple', label: 'Apple', value: 'apple' },
  { key: 'banana', label: 'Banana', value: 'banana' },
  { key: 'cherry', label: 'Cherry', value: 'cherry' },
  { key: 'durian', label: 'Durian', value: 'durian' },
];
</script>

<template>
  <ChronixAutoComplete v-model:value="value" :options="options" placeholder="Type to search..." />
</template>
