<script setup lang="ts">
import { ref } from 'vue';
import { ChronixDatePicker } from '@chronixjs/ui-vue3';

const date = ref<Date | undefined>(undefined);
</script>

<template>
  <ChronixDatePicker v-model:value="date" placeholder="Pick a date" />
</template>
