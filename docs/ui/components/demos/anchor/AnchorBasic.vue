<script setup lang="ts">
import { ChronixAnchor } from '@chronixjs/ui-vue3';

const items = [
  { key: 'sec-1', label: 'Section 1', href: '#section-1' },
  { key: 'sec-2', label: 'Section 2', href: '#section-2' },
  { key: 'sec-3', label: 'Section 3', href: '#section-3' },
];
</script>

<template>
  <ChronixAnchor :items="items" />
</template>
