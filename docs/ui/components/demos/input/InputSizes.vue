<script setup lang="ts">
import { ChronixInput } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px">
    <ChronixInput size="small" placeholder="Small" />
    <ChronixInput size="medium" placeholder="Medium" />
    <ChronixInput size="large" placeholder="Large" />
  </div>
</template>
