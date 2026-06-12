<script setup lang="ts">
import { ref } from 'vue';
import { ChronixDrawer, ChronixButton } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>

<template>
  <div>
    <ChronixButton @click="show = true">Open Drawer</ChronixButton>
    <ChronixDrawer v-model:show="show" title="Drawer Title">
      <p>Drawer body content goes here.</p>
    </ChronixDrawer>
  </div>
</template>
