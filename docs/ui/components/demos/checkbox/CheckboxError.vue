<script setup lang="ts">
import { ref } from 'vue';
import { ChronixCheckbox } from '@chronixjs/ui-vue3';

const agreed = ref(false);
</script>

<template>
  <ChronixCheckbox v-model:checked="agreed" error="You must agree to continue" label="Terms" />
</template>
