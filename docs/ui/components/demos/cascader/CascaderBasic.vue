<script setup lang="ts">
import { ref } from 'vue';
import { ChronixCascader } from '@chronixjs/ui-vue3';

const value = ref<string | undefined>(undefined);
const options = [
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    value: 'zhejiang',
    children: [
      {
        key: 'hangzhou',
        label: 'Hangzhou',
        value: 'hangzhou',
        children: [{ key: 'xihu', label: 'West Lake', value: 'xihu' }],
      },
      { key: 'ningbo', label: 'Ningbo', value: 'ningbo' },
    ],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    value: 'jiangsu',
    children: [{ key: 'nanjing', label: 'Nanjing', value: 'nanjing' }],
  },
];
</script>

<template>
  <ChronixCascader :options="options" v-model:value="value" placeholder="Select region" />
</template>
