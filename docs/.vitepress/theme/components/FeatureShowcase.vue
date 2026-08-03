<script setup lang="ts">
import { ref, computed } from 'vue';

interface FeatureItem {
  title: string;
  description?: string;
  code: string;
  codeVue2?: string;
  codeReact?: string;
  badge?: string;
}

const props = defineProps<{
  features: FeatureItem[];
}>();

const activeIndex = ref(0);
const showCode = ref(false);
const activeTab = ref<'vue3' | 'vue2' | 'react'>('vue3');

function selectFeature(index: number) {
  activeIndex.value = index;
  showCode.value = false;
  activeTab.value = 'vue3';
}

function toggleCode() {
  showCode.value = !showCode.value;
}

function switchTab(tab: 'vue3' | 'vue2' | 'react') {
  activeTab.value = tab;
}

function getCode(): string {
  const item = props.features[activeIndex.value];
  if (!item) return '';
  if (activeTab.value === 'vue2') return item.codeVue2 ?? item.code;
  if (activeTab.value === 'react') return item.codeReact ?? item.code;
  return item.code;
}

const currentItem = computed(() => props.features[activeIndex.value]);
</script>

<template>
  <div class="feature-showcase">
    <!-- Left: feature navigation -->
    <aside class="feature-showcase__nav">
      <div class="feature-showcase__nav-inner">
        <p class="feature-showcase__nav-label">功能导航</p>
        <ul class="feature-showcase__nav-list">
          <li
            v-for="(item, idx) in features"
            :key="idx"
            :class="[
              'feature-showcase__nav-item',
              { 'feature-showcase__nav-item--active': activeIndex === idx },
            ]"
            @click="selectFeature(idx)"
          >
            <span class="feature-showcase__nav-index">{{ idx + 1 }}</span>
            <span class="feature-showcase__nav-text">{{ item.title }}</span>
            <span v-if="item.badge" class="feature-showcase__nav-badge">{{ item.badge }}</span>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Right: single active demo -->
    <div class="feature-showcase__content">
      <!-- Header for current feature -->
      <div class="feature-showcase__section-header">
        <h3 class="feature-showcase__section-title">
          <span class="feature-showcase__section-number">{{ activeIndex + 1 }}</span>
          {{ currentItem?.title }}
        </h3>
        <p v-if="currentItem?.description" class="feature-showcase__section-desc">
          {{ currentItem.description }}
        </p>
      </div>

      <!-- Demo preview — only active slot is rendered -->
      <div class="feature-showcase__preview">
        <slot :name="`demo-${activeIndex}`" />
      </div>

      <!-- Code toggle -->
      <div class="feature-showcase__actions">
        <button class="feature-showcase__toggle" @click="toggleCode">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
          <span>{{ showCode ? '收起代码' : '查看代码' }}</span>
        </button>
      </div>

      <!-- Code panel -->
      <Transition name="fs-slide">
        <div v-if="showCode" class="feature-showcase__code-panel">
          <div class="feature-showcase__tabs">
            <button
              :class="[
                'feature-showcase__tab',
                { 'feature-showcase__tab--active': activeTab === 'vue3' },
              ]"
              @click="switchTab('vue3')"
            >
              Vue 3
            </button>
            <button
              v-if="currentItem?.codeVue2"
              :class="[
                'feature-showcase__tab',
                { 'feature-showcase__tab--active': activeTab === 'vue2' },
              ]"
              @click="switchTab('vue2')"
            >
              Vue 2
            </button>
            <button
              v-if="currentItem?.codeReact"
              :class="[
                'feature-showcase__tab',
                { 'feature-showcase__tab--active': activeTab === 'react' },
              ]"
              @click="switchTab('react')"
            >
              React
            </button>
          </div>
          <div class="feature-showcase__code">
            <pre><code>{{ getCode() }}</code></pre>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
