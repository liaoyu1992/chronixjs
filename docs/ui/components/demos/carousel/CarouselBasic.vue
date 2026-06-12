<script setup lang="ts">
import { ref } from 'vue';
import { ChronixCarousel } from '@chronixjs/ui-vue3';

const current = ref(0);
const items = ref([
  { key: 's1', content: 'Slide 1 — Introduction' },
  { key: 's2', content: 'Slide 2 — Features' },
  { key: 's3', content: 'Slide 3 — Get Started' },
]);
</script>

<template>
  <ChronixCarousel v-model:value="current" :items="items" :show-dots="true" />
</template>
