<script setup lang="ts">
import { ref } from 'vue';
import { ChronixRate } from '@chronixjs/ui-vue3';

const rating = ref(7);
</script>

<template>
  <ChronixRate v-model:value="rating" :count="10" />
</template>
