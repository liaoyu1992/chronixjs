<script setup lang="ts">
import { useMessage } from '@chronixjs/ui-vue3';
import { ChronixButton } from '@chronixjs/ui-vue3';

const message = useMessage();
</script>

<template>
  <div style="display: flex; gap: 8px">
    <ChronixButton @click="message.info('This is an info message')">Info</ChronixButton>
    <ChronixButton @click="message.success('Operation successful')">Success</ChronixButton>
    <ChronixButton @click="message.warning('Something went wrong')">Warning</ChronixButton>
    <ChronixButton @click="message.error('Error occurred')">Error</ChronixButton>
  </div>
</template>
