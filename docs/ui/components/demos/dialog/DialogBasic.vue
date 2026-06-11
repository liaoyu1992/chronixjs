<script setup lang="ts">
import { useDiscreteDialog } from '@chronixjs/ui-vue3';
import { ChronixButton } from '@chronixjs/ui-vue3';

const dialog = useDiscreteDialog();

function showDialog() {
  dialog.warning({
    title: 'Confirm Delete',
    content: 'Are you sure you want to delete this item?',
    positiveText: 'Delete',
    negativeText: 'Cancel',
  });
}
</script>

<template>
  <ChronixButton @click="showDialog">Open Dialog</ChronixButton>
</template>
