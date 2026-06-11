<script setup lang="ts">
import { ChronixFlex, ChronixButton } from '@chronixjs/ui-vue3';
</script>

<template>
  <ChronixFlex direction="column" :gap="12">
    <ChronixButton>Button 1</ChronixButton>
    <ChronixButton variant="primary">Button 2</ChronixButton>
    <ChronixButton>Button 3</ChronixButton>
  </ChronixFlex>
</template>
