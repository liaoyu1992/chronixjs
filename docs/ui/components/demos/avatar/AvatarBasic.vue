<script setup lang="ts">
import { ChronixAvatar } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; gap: 12px; align-items: center">
    <ChronixAvatar text="JD" :size="40" />
    <ChronixAvatar text="AB" :size="32" shape="square" />
    <ChronixAvatar :size="48">
      <span>👤</span>
    </ChronixAvatar>
  </div>
</template>
