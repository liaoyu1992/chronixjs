<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTimePicker } from '@chronixjs/ui-vue3';

const time = ref<Date | undefined>(undefined);
</script>

<template>
  <ChronixTimePicker v-model:value="time" placeholder="Pick a time" />
</template>
