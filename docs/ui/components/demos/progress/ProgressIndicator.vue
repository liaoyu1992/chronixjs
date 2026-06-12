<script setup lang="ts">
import { ChronixProgress } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <ChronixProgress :percentage="70" indicator-placement="outside" />
    <ChronixProgress :percentage="70" indicator-placement="inside" :height="24" />
  </div>
</template>
