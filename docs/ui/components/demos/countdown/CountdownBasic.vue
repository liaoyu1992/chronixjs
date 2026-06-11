<script setup lang="ts">
import { ChronixCountdown } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixCountdown label="Time Remaining" :duration="60000" :active="true" />
</template>
