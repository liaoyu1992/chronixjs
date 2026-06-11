<script setup lang="ts">
import { ref } from 'vue';
import { ChronixCollapse } from '@chronixjs/ui-vue3';

const active = ref('');
const items = [
  { key: '1', title: 'Panel 1', content: 'Content of panel 1' },
  { key: '2', title: 'Panel 2', content: 'Content of panel 2' },
  { key: '3', title: 'Panel 3', content: 'Content of panel 3' },
];
</script>

<template>
  <ChronixCollapse :items="items" v-model:value="active" accordion />
</template>
