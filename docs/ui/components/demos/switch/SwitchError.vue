<script setup lang="ts">
import { ref } from 'vue';
import { ChronixSwitch } from '@chronixjs/ui-vue3';

const agreed = ref(false);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <div style="display: flex; align-items: center; gap: 12px">
      <ChronixSwitch v-model:checked="agreed" />
      <span style="font-size: 13px; color: #888">{{ agreed ? '已同意' : '未同意' }}</span>
    </div>
    <ChronixSwitch v-model:checked="agreed" error="请先同意用户协议" />
  </div>
</template>
