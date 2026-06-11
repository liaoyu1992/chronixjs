<script setup lang="ts">
import { ChronixTag } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; gap: 8px; flex-wrap: wrap">
    <ChronixTag type="primary" bordered>有边框</ChronixTag>
    <ChronixTag type="primary" :bordered="false">无边框</ChronixTag>
    <ChronixTag type="success" bordered>有边框</ChronixTag>
    <ChronixTag type="success" :bordered="false">无边框</ChronixTag>
  </div>
</template>
