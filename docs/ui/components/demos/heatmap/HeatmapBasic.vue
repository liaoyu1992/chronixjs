<script setup lang="ts">
import { ChronixHeatmap } from '@chronixjs/ui-vue3';

const cells = [
  [3, 7, 2, 9, 5, 1, 8],
  [6, 1, 8, 4, 7, 3, 2],
  [9, 5, 3, 6, 1, 8, 4],
  [2, 8, 6, 1, 9, 4, 7],
  [4, 3, 9, 7, 2, 6, 1],
];
</script>

<template>
  <ChronixHeatmap :cells="cells" :cell-size="24" color-low="#dbeafe" color-high="#1e3a8a" />
</template>
