<script setup lang="ts">
import { ChronixButton } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; gap: 8px">
    <ChronixButton disabled>Disabled</ChronixButton>
    <ChronixButton variant="primary" disabled>Disabled Primary</ChronixButton>
  </div>
</template>
