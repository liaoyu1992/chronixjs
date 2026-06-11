<script setup lang="ts">
import { ChronixTag } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; gap: 8px; flex-wrap: wrap">
    <ChronixTag type="primary">正常</ChronixTag>
    <ChronixTag type="primary" disabled>禁用</ChronixTag>
    <ChronixTag type="success">正常</ChronixTag>
    <ChronixTag type="success" disabled>禁用</ChronixTag>
  </div>
</template>
