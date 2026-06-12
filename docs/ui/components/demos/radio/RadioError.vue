<script setup lang="ts">
import { ref } from 'vue';
import { ChronixRadioGroup } from '@chronixjs/ui-vue3';

const val = ref('');
const options = [
  { key: 'a', label: 'Option A', value: 'a', disabled: false },
  { key: 'b', label: 'Option B', value: 'b', disabled: false },
];
</script>

<template>
  <ChronixRadioGroup v-model:value="val" :options="options" error="Please select an option" />
</template>
