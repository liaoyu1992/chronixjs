<script setup lang="ts">
import { ref } from 'vue';
import { ChronixInputOtp } from '@chronixjs/ui-vue3';

const otp = ref('');
</script>

<template>
  <ChronixInputOtp v-model:value="otp" :length="6" />
</template>
