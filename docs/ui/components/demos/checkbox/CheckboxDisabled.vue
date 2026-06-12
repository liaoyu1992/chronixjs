<script setup lang="ts">
import { ChronixCheckbox } from '@chronixjs/ui-vue3';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <ChronixCheckbox checked disabled label="Disabled checked" />
    <ChronixCheckbox disabled label="Disabled unchecked" />
  </div>
</template>
