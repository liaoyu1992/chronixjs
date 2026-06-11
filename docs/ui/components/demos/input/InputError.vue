<script setup lang="ts">
import { ref } from 'vue';
import { ChronixInput } from '@chronixjs/ui-vue3';

const email = ref('invalid');
</script>

<template>
  <div style="max-width: 320px">
    <ChronixInput v-model:value="email" error="请输入有效的邮箱地址" />
  </div>
</template>
