<script setup lang="ts">
import { ref } from 'vue';
import { ChronixInput } from '@chronixjs/ui-vue3';

const value = ref('');
</script>

<template>
  <div style="max-width: 320px">
    <ChronixInput v-model:value="value" type="textarea" :rows="4" placeholder="请输入多行文本" />
  </div>
</template>
