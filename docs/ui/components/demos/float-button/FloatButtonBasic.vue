<script setup lang="ts">
import { ChronixFloatButton } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="position: relative; height: 200px; border: 1px dashed #ccc; border-radius: 8px">
    <p style="padding: 16px; color: #666">Scroll area content</p>
    <ChronixFloatButton
      shape="circle"
      type="primary"
      :right="24"
      :bottom="24"
      icon="plus"
      tooltip="Add new item"
    />
  </div>
</template>
