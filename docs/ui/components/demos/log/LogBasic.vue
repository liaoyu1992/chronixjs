<script setup lang="ts">
import { ref } from 'vue';
import { ChronixLog } from '@chronixjs/ui-vue3';

const lines = ref([
  '[info] Starting application...',
  '[info] Loading configuration from config.yaml',
  '[info] Database connection established',
  '[warn] Deprecated API usage detected in module A',
  '[info] Cache warmed up: 128 entries loaded',
  '[info] Server listening on port 3000',
  '[debug] Request: GET /api/users (200 OK)',
  '[debug] Request: POST /api/orders (201 Created)',
  '[info] Background job completed: email-batch-001',
  '[info] All systems operational',
]);
</script>

<template>
  <ChronixLog :lines="lines" line-numbers :max-height="300" />
</template>
