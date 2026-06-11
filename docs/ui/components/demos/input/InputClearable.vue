<script setup lang="ts">
import { ref } from 'vue';
import { ChronixInput } from '@chronixjs/ui-vue3';

const value = ref('可清除的内容');
</script>

<template>
  <div style="max-width: 320px">
    <ChronixInput v-model:value="value" clearable placeholder="可清除输入框" />
  </div>
</template>
