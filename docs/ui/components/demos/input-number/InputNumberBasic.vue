<script setup lang="ts">
import { ref } from 'vue';
import { ChronixInputNumber } from '@chronixjs/ui-vue3';

const count = ref<number | null>(0);
</script>

<template>
  <ChronixInputNumber v-model:value="count" :step="1" />
</template>
