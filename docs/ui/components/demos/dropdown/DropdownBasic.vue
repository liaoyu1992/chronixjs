<script setup lang="ts">
import { ChronixDropdown, ChronixButton } from '@chronixjs/ui-vue3';

const options = [
  { key: '1', label: 'Option 1' },
  { key: '2', label: 'Option 2' },
  { key: '3', label: 'Option 3' },
];
</script>

<template>
  <ChronixDropdown :options="options" trigger="click">
    <ChronixButton>Click Me</ChronixButton>
  </ChronixDropdown>
</template>
