<script setup lang="ts">
import { ChronixSkeleton } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <ChronixSkeleton shape="text" width="60%" />
    <ChronixSkeleton shape="rect" :width="200" :height="120" />
    <ChronixSkeleton shape="circle" :width="64" :height="64" />
  </div>
</template>
