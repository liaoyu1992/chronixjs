<script setup lang="ts">
import { ref } from 'vue';
import { ChronixModal } from '@chronixjs/ui-vue3';

const show = ref(false);
</script>

<template>
  <div>
    <button style="padding: 6px 16px; cursor: pointer" @click="show = true">Open Modal</button>
    <ChronixModal v-model:show="show" title="Confirm">
      <p>Are you sure you want to proceed?</p>
      <template #footer>
        <button style="padding: 4px 12px; cursor: pointer" @click="show = false">Cancel</button>
        <button style="padding: 4px 12px; cursor: pointer" @click="show = false">Confirm</button>
      </template>
    </ChronixModal>
  </div>
</template>
