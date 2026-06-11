<script setup lang="ts">
import { ChronixBackTop } from '@chronixjs/ui-vue3';
</script>

<template>
  <div
    style="
      height: 200px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
    "
  >
    <p v-for="i in 20" :key="i" style="margin: 0 0 8px">
      Scroll down to see the back-to-top button. Line {{ i }}.
    </p>
    <ChronixBackTop :visibility-threshold="100" :right="20" :bottom="20" behavior="smooth" />
  </div>
</template>
