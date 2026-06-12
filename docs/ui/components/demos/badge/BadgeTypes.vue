<script setup lang="ts">
import { ChronixBadge } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; gap: 12px">
    <ChronixBadge :value="5" type="default" />
    <ChronixBadge :value="5" type="success" />
    <ChronixBadge :value="5" type="warning" />
    <ChronixBadge :value="5" type="error" />
    <ChronixBadge :value="5" type="info" />
  </div>
</template>
