<script setup lang="ts">
import { ChronixAlert } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <ChronixAlert>Default message</ChronixAlert>
    <ChronixAlert type="info">Info message</ChronixAlert>
    <ChronixAlert type="success">Success message</ChronixAlert>
    <ChronixAlert type="warning">Warning message</ChronixAlert>
    <ChronixAlert type="error">Error message</ChronixAlert>
  </div>
</template>
