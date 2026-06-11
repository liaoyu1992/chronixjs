<script setup lang="ts">
import { ref } from 'vue';
import { ChronixPagination } from '@chronixjs/ui-vue3';

const page = ref(1);
</script>

<template>
  <ChronixPagination v-model:page="page" :page-count="10" />
</template>
