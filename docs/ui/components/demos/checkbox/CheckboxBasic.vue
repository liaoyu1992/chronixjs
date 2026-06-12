<script setup lang="ts">
import { ref } from 'vue';
import { ChronixCheckbox } from '@chronixjs/ui-vue3';

const checked = ref(false);
</script>

<template>
  <ChronixCheckbox v-model:checked="checked" label="Accept terms" />
</template>
