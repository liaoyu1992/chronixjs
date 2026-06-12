<script setup lang="ts">
import { ChronixWatermark } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixWatermark content="Chronix">
    <div style="height: 300px; padding: 24px; background: #fafafa; border-radius: 8px">
      <h3 style="margin: 0 0 12px">Protected Content</h3>
      <p style="color: #666">This area is covered by a watermark overlay.</p>
      <p style="color: #666">The watermark text "Chronix" repeats across the entire region.</p>
    </div>
  </ChronixWatermark>
</template>
