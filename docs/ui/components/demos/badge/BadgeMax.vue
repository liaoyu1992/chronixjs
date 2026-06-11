<script setup lang="ts">
import { ChronixBadge, ChronixButton } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixBadge :value="150" :max="99">
    <ChronixButton>Notifications</ChronixButton>
  </ChronixBadge>
</template>
