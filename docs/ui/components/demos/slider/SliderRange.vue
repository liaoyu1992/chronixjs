<script setup lang="ts">
import { ref } from 'vue';
import { ChronixSlider } from '@chronixjs/ui-vue3';

const range = ref([20, 80] as [number, number]);
</script>

<template>
  <ChronixSlider v-model:value="range" range :min="0" :max="100" />
</template>
