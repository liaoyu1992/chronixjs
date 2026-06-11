<script setup lang="ts">
import { ref } from 'vue';
import { ChronixTag } from '@chronixjs/ui-vue3';

const tags = ref(['标签一', '标签二', '标签三']);

function handleClose(index: number) {
  tags.value.splice(index, 1);
}
</script>

<template>
  <div style="display: flex; gap: 8px; flex-wrap: wrap">
    <ChronixTag v-for="(tag, i) in tags" :key="tag" closable @close="handleClose(i)">
      {{ tag }}
    </ChronixTag>
    <span v-if="tags.length === 0" style="color: #888; font-size: 13px">所有标签已关闭</span>
  </div>
</template>
