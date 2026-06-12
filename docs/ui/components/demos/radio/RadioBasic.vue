<script setup lang="ts">
import { ref } from 'vue';
import { ChronixRadioGroup } from '@chronixjs/ui-vue3';

const selected = ref('vue');
const options = [
  { key: 'vue', label: 'Vue', value: 'vue', disabled: false },
  { key: 'react', label: 'React', value: 'react', disabled: false },
  { key: 'angular', label: 'Angular', value: 'angular', disabled: false },
];
</script>

<template>
  <ChronixRadioGroup v-model:value="selected" :options="options" />
</template>
