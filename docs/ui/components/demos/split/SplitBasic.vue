<script setup lang="ts">
import { ChronixSplit } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixSplit default-size="50%" style="height: 200px">
    <template #first>
      <div style="padding: 16px">Left Pane</div>
    </template>
    <template #second>
      <div style="padding: 16px">Right Pane</div>
    </template>
  </ChronixSplit>
</template>
