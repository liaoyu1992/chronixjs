<script setup lang="ts">
import { useNotification } from '@chronixjs/ui-vue3';
import { ChronixButton } from '@chronixjs/ui-vue3';

const notify = useNotification();
</script>

<template>
  <div style="display: flex; gap: 8px">
    <ChronixButton @click="notify.info({ title: 'Info', description: 'Notification content' })"
      >Info</ChronixButton
    >
    <ChronixButton @click="notify.success({ title: 'Success', description: 'Operation done' })"
      >Success</ChronixButton
    >
    <ChronixButton @click="notify.warning({ title: 'Warning', description: 'Check this' })"
      >Warning</ChronixButton
    >
    <ChronixButton @click="notify.error({ title: 'Error', description: 'Something failed' })"
      >Error</ChronixButton
    >
  </div>
</template>
