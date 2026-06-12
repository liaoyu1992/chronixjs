<script setup lang="ts">
import { ref } from 'vue';
import { ChronixCollapseTransition } from '@chronixjs/ui-vue3';

const visible = ref(false);
</script>

<template>
  <div>
    <button @click="visible = !visible" style="margin-bottom: 8px">
      {{ visible ? 'Hide' : 'Show' }} Content
    </button>
    <ChronixCollapseTransition :show="visible">
      <div style="padding: 16px; background: #f5f5f5; border: 1px solid #ddd">
        Collapsible content here.
      </div>
    </ChronixCollapseTransition>
  </div>
</template>
