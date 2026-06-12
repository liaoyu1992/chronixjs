<script setup lang="ts">
import { ref } from 'vue';
import { ChronixCalendar } from '@chronixjs/ui-vue3';

const selected = ref<Date | undefined>(undefined);
</script>

<template>
  <ChronixCalendar v-model:value="selected" />
</template>
