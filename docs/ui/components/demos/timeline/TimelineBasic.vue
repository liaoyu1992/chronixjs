<script setup lang="ts">
import { ChronixTimeline } from '@chronixjs/ui-vue3';

const items = [
  { key: '1', content: 'Application submitted', type: 'default' },
  { key: '2', content: 'Under review', type: 'info' },
  { key: '3', content: 'Approved', type: 'success' },
  { key: '4', content: 'Deployment failed', type: 'error' },
];
</script>

<template>
  <ChronixTimeline :items="items" />
</template>
