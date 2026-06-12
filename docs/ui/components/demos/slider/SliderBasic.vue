<script setup lang="ts">
import { ref } from 'vue';
import { ChronixSlider } from '@chronixjs/ui-vue3';

const val = ref(50);
</script>

<template>
  <ChronixSlider v-model:value="val" :min="0" :max="100" />
</template>
