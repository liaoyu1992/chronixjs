<script setup lang="ts">
import { ref } from 'vue';
import { ChronixInfiniteScroll } from '@chronixjs/ui-vue3';

const items = ref(Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`));
const loading = ref(false);

async function onLoad() {
  loading.value = true;
  const start = items.value.length;
  const newItems = Array.from({ length: 10 }, (_, i) => `Item ${start + i + 1}`);
  items.value.push(...newItems);
  loading.value = false;
}
</script>

<template>
  <div
    style="
      height: 200px;
      overflow: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
    "
  >
    <ChronixInfiniteScroll :distance="100" :loading="loading" @load="onLoad">
      <div v-for="item in items" :key="item" style="padding: 4px 0">{{ item }}</div>
    </ChronixInfiniteScroll>
  </div>
</template>
