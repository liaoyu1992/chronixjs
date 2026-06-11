<script setup lang="ts">
import { ChronixProgress } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <ChronixProgress :percentage="30" />
    <ChronixProgress :percentage="60" type="success" />
    <ChronixProgress :percentage="100" type="warning" />
  </div>
</template>
