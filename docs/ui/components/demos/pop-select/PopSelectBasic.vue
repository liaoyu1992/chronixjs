<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChronixPopSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);
const open = ref(false);
const options = ref([
  { key: 'a', label: 'Apple', value: 'apple', disabled: false },
  { key: 'b', label: 'Banana', value: 'banana', disabled: false },
  { key: 'c', label: 'Cherry', value: 'cherry', disabled: false },
]);

const selectedLabel = computed(() => options.value.find((o) => o.value === selected.value)?.label);
</script>

<template>
  <ChronixPopSelect v-model:value="selected" v-model:show="open" :options="options" trigger="click">
    <button @click="open = true">{{ selectedLabel || 'Select...' }}</button>
  </ChronixPopSelect>
</template>
