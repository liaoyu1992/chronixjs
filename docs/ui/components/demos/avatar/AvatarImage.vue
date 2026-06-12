<script setup lang="ts">
import { ChronixAvatar } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; gap: 12px; align-items: center">
    <ChronixAvatar src="https://picsum.photos/40/40" :size="40" />
    <ChronixAvatar src="https://picsum.photos/48/48" :size="48" shape="square" />
  </div>
</template>
