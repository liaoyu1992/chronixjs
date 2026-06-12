<script setup lang="ts">
import { ChronixSkeleton } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <ChronixSkeleton shape="text" width="70%" :animated="false" />
    <ChronixSkeleton shape="text" width="50%" :animated="false" />
    <ChronixSkeleton shape="rect" :width="200" :height="100" :animated="false" />
  </div>
</template>
