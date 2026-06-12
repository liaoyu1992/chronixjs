<script setup lang="ts">
import { reactive } from 'vue';
import { ChronixForm, ChronixFormItem, ChronixInput } from '@chronixjs/ui-vue3';

const form = reactive({ name: '', email: '' });
</script>

<template>
  <ChronixForm :model="form" label-placement="left" :label-width="60">
    <ChronixFormItem label="Name" path="name" required>
      <ChronixInput v-model:value="form.name" placeholder="Please enter your name" />
    </ChronixFormItem>
    <ChronixFormItem label="Email" path="email" required>
      <ChronixInput v-model:value="form.email" placeholder="Please enter your email" />
    </ChronixFormItem>
  </ChronixForm>
</template>
