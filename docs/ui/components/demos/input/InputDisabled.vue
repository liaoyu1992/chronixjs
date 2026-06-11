<script setup lang="ts">
import { ChronixInput } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 320px">
    <ChronixInput value="正常状态" placeholder="正常输入框" />
    <ChronixInput value="禁用状态" disabled placeholder="禁用输入框" />
  </div>
</template>
