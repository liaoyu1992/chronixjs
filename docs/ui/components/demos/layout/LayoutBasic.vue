<script setup lang="ts">
import {
  ChronixLayout,
  ChronixLayoutHeader,
  ChronixLayoutContent,
  ChronixLayoutFooter,
} from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixLayout
    style="height: 240px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden"
  >
    <ChronixLayoutHeader style="background: #f0f5ff; padding: 12px 16px"
      >Header</ChronixLayoutHeader
    >
    <ChronixLayoutContent style="padding: 16px">Content</ChronixLayoutContent>
    <ChronixLayoutFooter style="background: #f0f5ff; padding: 12px 16px"
      >Footer</ChronixLayoutFooter
    >
  </ChronixLayout>
</template>
