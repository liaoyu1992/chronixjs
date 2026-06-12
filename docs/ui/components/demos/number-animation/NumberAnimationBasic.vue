<script setup lang="ts">
import { ChronixNumberAnimation } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixNumberAnimation
    :from="0"
    :to="10000"
    :duration="2000"
    :active="true"
    :show-separator="true"
  />
</template>
