<script setup lang="ts">
import { ChronixSkeleton } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <ChronixSkeleton shape="text" />
    <ChronixSkeleton shape="text" width="80%" />
    <ChronixSkeleton shape="text" width="60%" />
  </div>
</template>
