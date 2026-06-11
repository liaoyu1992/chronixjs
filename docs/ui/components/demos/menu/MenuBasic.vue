<script setup lang="ts">
import { ref } from 'vue';
import { ChronixMenu } from '@chronixjs/ui-vue3';

const active = ref('home');

const items = [
  { key: 'home', label: 'Home' },
  { key: 'products', label: 'Products' },
  { key: 'docs', label: 'Docs' },
  { key: 'about', label: 'About' },
];
</script>

<template>
  <ChronixMenu v-model:value="active" :items="items" mode="horizontal" />
</template>
