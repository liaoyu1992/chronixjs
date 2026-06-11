<script setup lang="ts">
import { ChronixSpace, ChronixButton } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <ChronixSpace size="small">
      <ChronixButton>Small</ChronixButton>
      <ChronixButton>Small</ChronixButton>
    </ChronixSpace>
    <ChronixSpace size="medium">
      <ChronixButton>Medium</ChronixButton>
      <ChronixButton>Medium</ChronixButton>
    </ChronixSpace>
    <ChronixSpace size="large">
      <ChronixButton>Large</ChronixButton>
      <ChronixButton>Large</ChronixButton>
    </ChronixSpace>
  </div>
</template>
