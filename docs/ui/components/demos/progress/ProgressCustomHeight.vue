<script setup lang="ts">
import { ChronixProgress } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <ChronixProgress :percentage="50" :height="8" />
    <ChronixProgress :percentage="50" :height="16" />
    <ChronixProgress :percentage="50" :height="24" />
  </div>
</template>
