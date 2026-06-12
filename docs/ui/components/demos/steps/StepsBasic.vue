<script setup lang="ts">
import { ref } from 'vue';
import { ChronixSteps } from '@chronixjs/ui-vue3';

const current = ref(1);
const items = [
  { key: '1', label: 'Login', description: 'Login to your account' },
  { key: '2', label: 'Profile', description: 'Fill in your profile' },
  { key: '3', label: 'Complete', description: 'All done' },
];
</script>

<template>
  <ChronixSteps :items="items" :current="current" />
</template>
