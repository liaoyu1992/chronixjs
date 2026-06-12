<script setup lang="ts">
import { ref } from 'vue';
import { ChronixDynamicInput } from '@chronixjs/ui-vue3';

const items = ref<string[]>(['Item 1', 'Item 2', 'Item 3']);
</script>

<template>
  <ChronixDynamicInput v-model:value="items" />
</template>
