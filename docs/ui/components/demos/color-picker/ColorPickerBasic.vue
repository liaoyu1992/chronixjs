<script setup lang="ts">
import { ref } from 'vue';
import { ChronixColorPicker } from '@chronixjs/ui-vue3';

const color = ref<string | null>('#3b82f6');
</script>

<template>
  <ChronixColorPicker v-model:value="color" />
</template>
