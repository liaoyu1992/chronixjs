<script setup lang="ts">
import { ChronixPopconfirm, ChronixButton } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixPopconfirm title="Are you sure?">
    <template #default>
      <ChronixButton>Delete</ChronixButton>
    </template>
  </ChronixPopconfirm>
</template>
