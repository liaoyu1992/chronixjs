<script setup lang="ts">
import { ChronixTag } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; gap: 8px; flex-wrap: wrap">
    <ChronixTag round>Round Default</ChronixTag>
    <ChronixTag type="primary" round>Round Primary</ChronixTag>
    <ChronixTag type="success" round>Round Success</ChronixTag>
  </div>
</template>
