<script setup lang="ts">
import { ref } from 'vue';
import { ChronixRadioGroup } from '@chronixjs/ui-vue3';

const val = ref('a');
const options = [
  { key: 'a', label: 'Option A', value: 'a', disabled: false },
  { key: 'b', label: 'Option B (disabled)', value: 'b', disabled: true },
  { key: 'c', label: 'Option C', value: 'c', disabled: false },
];
</script>

<template>
  <ChronixRadioGroup v-model:value="val" :options="options" />
</template>
