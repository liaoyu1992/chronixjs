<script setup lang="ts">
import { ref } from 'vue';
import { ChronixMention } from '@chronixjs/ui-vue3';

const text = ref('');
const options = [
  { key: 'alice', label: 'Alice', value: 'alice' },
  { key: 'bob', label: 'Bob', value: 'bob' },
  { key: 'charlie', label: 'Charlie', value: 'charlie' },
];
</script>

<template>
  <ChronixMention
    v-model:value="text"
    :options="options"
    trigger="@"
    placeholder="Type @ to mention someone..."
  />
</template>
