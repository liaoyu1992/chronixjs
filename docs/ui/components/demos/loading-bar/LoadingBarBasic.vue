<script setup lang="ts">
import { useLoadingBar } from '@chronixjs/ui-vue3';

const loadingBar = useLoadingBar();
</script>

<template>
  <div>
    <div style="display: flex; gap: 8px; margin-bottom: 16px">
      <button style="padding: 4px 12px; cursor: pointer" @click="loadingBar.start()">Start</button>
      <button style="padding: 4px 12px; cursor: pointer" @click="loadingBar.finish()">
        Finish
      </button>
      <button style="padding: 4px 12px; cursor: pointer" @click="loadingBar.error()">Error</button>
    </div>
    <div :class="loadingBar.classList.value" />
  </div>
</template>
