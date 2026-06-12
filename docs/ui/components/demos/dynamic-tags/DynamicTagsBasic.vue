<script setup lang="ts">
import { ref } from 'vue';
import { ChronixDynamicTags } from '@chronixjs/ui-vue3';

const tags = ref<string[]>(['Tag 1', 'Tag 2']);
</script>

<template>
  <ChronixDynamicTags v-model:value="tags" />
</template>
