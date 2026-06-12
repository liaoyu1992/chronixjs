<script setup lang="ts">
import { ref } from 'vue';
import { ChronixUpload } from '@chronixjs/ui-vue3';

const fileList = ref([]);
</script>

<template>
  <div style="max-width: 480px">
    <ChronixUpload
      action="/api/upload"
      :file-list="fileList"
      accept="image/*"
      @update:file-list="fileList = $event"
    />
    <p style="font-size: 13px; color: #888; margin-top: 8px">Only image files are accepted.</p>
  </div>
</template>
