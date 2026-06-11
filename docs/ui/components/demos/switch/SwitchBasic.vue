<script setup lang="ts">
import { ref } from 'vue';
import { ChronixSwitch } from '@chronixjs/ui-vue3';

const checked = ref(false);
</script>

<template>
  <div style="display: flex; align-items: center; gap: 12px">
    <ChronixSwitch v-model:checked="checked" />
    <span style="font-size: 13px; color: #888">{{ checked ? '开启' : '关闭' }}</span>
  </div>
</template>
