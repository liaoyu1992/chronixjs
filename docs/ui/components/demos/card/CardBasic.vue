<script setup lang="ts">
import { ChronixCard } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixCard title="Card Title" style="max-width: 360px">
    Card body content goes here.
    <template #footer>Footer content</template>
  </ChronixCard>
</template>
