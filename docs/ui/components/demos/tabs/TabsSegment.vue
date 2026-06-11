<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTabs } from '@chronixjs/ui-vue3';

const activeTab = ref('tab1');
const items = [
  { key: 'tab1', label: 'Tab 1', content: 'Content of Tab 1' },
  { key: 'tab2', label: 'Tab 2', content: 'Content of Tab 2' },
  { key: 'tab3', label: 'Tab 3', content: 'Content of Tab 3' },
];
</script>

<template>
  <ChronixTabs v-model:value="activeTab" :items="items" type="segment" />
</template>
