<script setup lang="ts">
import { ChronixProgress } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <ChronixProgress :percentage="20" type="default" />
    <ChronixProgress :percentage="40" type="success" />
    <ChronixProgress :percentage="60" type="warning" />
    <ChronixProgress :percentage="80" type="error" />
    <ChronixProgress :percentage="90" type="info" />
  </div>
</template>
