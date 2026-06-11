<script setup lang="ts">
import { ChronixTag } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; gap: 8px; flex-wrap: wrap">
    <ChronixTag>Default</ChronixTag>
    <ChronixTag type="primary">Primary</ChronixTag>
    <ChronixTag type="info">Info</ChronixTag>
    <ChronixTag type="success">Success</ChronixTag>
    <ChronixTag type="warning">Warning</ChronixTag>
    <ChronixTag type="error">Error</ChronixTag>
  </div>
</template>
