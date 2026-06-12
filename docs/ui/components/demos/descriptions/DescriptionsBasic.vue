<script setup lang="ts">
import { ref } from 'vue';
import { ChronixDescriptions } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'name', label: 'Name', value: 'Chronix UI' },
  { key: 'version', label: 'Version', value: '0.1.0' },
  { key: 'license', label: 'License', value: 'MIT' },
]);
</script>

<template>
  <ChronixDescriptions :items="items" :columns="1" />
</template>
