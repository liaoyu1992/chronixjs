<script setup lang="ts">
import { ref } from 'vue';
import { ChronixBreadcrumb } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'home', label: 'Home', href: '/' },
  { key: 'products', label: 'Products', href: '/products' },
  { key: 'detail', label: 'Detail' },
]);
</script>

<template>
  <ChronixBreadcrumb :items="items" />
</template>
