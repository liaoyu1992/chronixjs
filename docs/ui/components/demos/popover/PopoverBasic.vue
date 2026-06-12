<script setup lang="ts">
import { ChronixPopover, ChronixButton } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixPopover trigger="click">
    <template #default>
      <ChronixButton>Click me</ChronixButton>
    </template>
    <template #content>
      <p>This is the popover content.</p>
    </template>
  </ChronixPopover>
</template>
