<script setup lang="ts">
import { ref } from 'vue';
import { ChronixAlert } from '@chronixjs/ui-vue3';

const show = ref(true);
</script>

<template>
  <ChronixAlert v-if="show" type="warning" closable @close="show = false"
    >This alert can be closed.</ChronixAlert
  >
</template>
