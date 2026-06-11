<script setup lang="ts">
import { ChronixMarquee } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixMarquee direction="left" :speed="40" pause-on-hover>
    <span
      >This is a scrolling marquee text that demonstrates the basic usage of the Marquee
      component.</span
    >
  </ChronixMarquee>
</template>
