<script setup lang="ts">
import { ChronixScrollbar } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixScrollbar style="height: 200px">
    <p v-for="i in 20" :key="i">Scrollable content line {{ i }}</p>
  </ChronixScrollbar>
</template>
