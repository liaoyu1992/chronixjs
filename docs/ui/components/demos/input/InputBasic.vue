<script setup lang="ts">
import { ref } from 'vue';
import { ChronixInput } from '@chronixjs/ui-vue3';

const value = ref('');
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px">
    <ChronixInput v-model:value="value" placeholder="请输入内容" />
    <p style="font-size: 13px; color: #888">当前值：{{ value }}</p>
  </div>
</template>
