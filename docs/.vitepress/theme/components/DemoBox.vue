<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title?: string;
  description?: string;
  code: string;
  codeVue2?: string;
  codeReact?: string;
}>();

const showCode = ref(false);
const activeTab = ref<'vue3' | 'vue2' | 'react'>('vue3');

function switchTab(tab: 'vue3' | 'vue2' | 'react') {
  activeTab.value = tab;
}
</script>

<template>
  <div class="demo-box">
    <div v-if="title" class="demo-box__header">
      <span class="demo-box__title">{{ title }}</span>
    </div>
    <div v-if="description" class="demo-box__desc">{{ description }}</div>

    <!-- Live preview -->
    <div class="demo-box__preview">
      <slot />
    </div>

    <!-- Divider + toggle -->
    <div class="demo-box__actions">
      <button class="demo-box__toggle" @click="showCode = !showCode">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span>{{ showCode ? '收起代码' : '展开代码' }}</span>
      </button>
    </div>

    <!-- Source code panel -->
    <Transition name="demo-box-slide">
      <div v-if="showCode" class="demo-box__code-panel">
        <!-- Framework tabs -->
        <div class="demo-box__tabs">
          <button
            :class="['demo-box__tab', { 'demo-box__tab--active': activeTab === 'vue3' }]"
            @click="switchTab('vue3')"
          >
            Vue 3
          </button>
          <button
            v-if="codeVue2"
            :class="['demo-box__tab', { 'demo-box__tab--active': activeTab === 'vue2' }]"
            @click="switchTab('vue2')"
          >
            Vue 2
          </button>
          <button
            v-if="codeReact"
            :class="['demo-box__tab', { 'demo-box__tab--active': activeTab === 'react' }]"
            @click="switchTab('react')"
          >
            React
          </button>
        </div>
        <!-- Code content -->
        <div class="demo-box__code">
          <pre><code>{{ activeTab === 'vue3' ? code : activeTab === 'vue2' ? codeVue2 : codeReact }}</code></pre>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.demo-box {
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
  background: var(--vp-c-bg, #fff);
}

.demo-box__header {
  padding: 12px 24px 0;
}

.demo-box__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.demo-box__desc {
  padding: 4px 24px 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.demo-box__preview {
  padding: 24px;
}

.demo-box__actions {
  border-top: 1px solid var(--vp-c-divider, #e2e2e3);
  display: flex;
  justify-content: center;
}

.demo-box__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.demo-box__toggle:hover {
  color: var(--vp-c-brand-1);
}

/* Code panel */
.demo-box__code-panel {
  border-top: 1px solid var(--vp-c-divider, #e2e2e3);
}

/* Framework tabs */
.demo-box__tabs {
  display: flex;
  border-bottom: 1px solid var(--vp-c-divider, #e2e2e3);
  padding: 0 16px;
  background: var(--vp-c-bg-soft, #f6f6f7);
}

.demo-box__tab {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
  margin-bottom: -1px;
}

.demo-box__tab:hover {
  color: var(--vp-c-text-2);
}

.demo-box__tab--active {
  color: var(--vp-c-brand-1);
  border-bottom-color: var(--vp-c-brand-1);
}

/* Code block */
.demo-box__code {
  background: var(--vp-code-bg, #1e1e1e);
  overflow-x: auto;
}

.demo-box__code pre {
  margin: 0;
  padding: 16px 24px;
}

.demo-box__code code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--vp-c-text-1);
  white-space: pre;
}

/* Slide transition */
.demo-box-slide-enter-active,
.demo-box-slide-leave-active {
  transition: all 0.25s ease;
  max-height: 600px;
  overflow: hidden;
}

.demo-box-slide-enter-from,
.demo-box-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding: 0;
}
</style>
