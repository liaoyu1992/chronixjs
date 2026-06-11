<script setup lang="ts">
import { ChronixButton } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px; max-width: 400px">
    <ChronixButton variant="primary" block>Block Button</ChronixButton>
    <ChronixButton block>Block Default</ChronixButton>
  </div>
</template>
