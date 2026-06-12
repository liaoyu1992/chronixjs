<script setup lang="ts">
import { ref } from 'vue';
import { ChronixAvatarGroup } from '@chronixjs/ui-vue3';

const items = ref([
  { key: 'a', src: 'https://i.pravatar.cc/32?img=1', text: undefined },
  { key: 'b', src: 'https://i.pravatar.cc/32?img=2', text: undefined },
  { key: 'c', src: undefined, text: 'JD' },
  { key: 'd', src: 'https://i.pravatar.cc/32?img=4', text: undefined },
]);
</script>

<template>
  <ChronixAvatarGroup :items="items" :max="3" :size="32" />
</template>
