<script setup lang="ts">
import { ChronixEllipsis } from '@chronixjs/ui-vue3';

const longText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';
</script>

<template>
  <div style="max-width: 360px">
    <ChronixEllipsis :content="longText" :line-clamp="2" />
  </div>
</template>
