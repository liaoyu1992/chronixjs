<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

interface FeatureItem {
  title: string;
  description?: string;
  code: string;
  codeVue2?: string;
  codeReact?: string;
  badge?: string;
}

defineProps<{
  features: FeatureItem[];
}>();

const activeIndex = ref(0);
const showCode = ref<Record<number, boolean>>({});
const activeTab = ref<Record<number, 'vue3' | 'vue2' | 'react'>>({});
const sectionRefs = ref<HTMLElement[]>([]);

function setSectionRef(el: HTMLElement | null, idx: number) {
  if (el) {
    sectionRefs.value[idx] = el;
  }
}

function scrollToFeature(index: number) {
  const el = sectionRefs.value[index];
  if (el) {
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    activeIndex.value = index;
  }
}

function toggleCode(index: number) {
  showCode.value[index] = !showCode.value[index];
}

function switchTab(index: number, tab: 'vue3' | 'vue2' | 'react') {
  activeTab.value[index] = tab;
}

function getCode(item: FeatureItem, index: number): string {
  const tab = activeTab.value[index] ?? 'vue3';
  if (tab === 'vue2') return item.codeVue2 ?? item.code;
  if (tab === 'react') return item.codeReact ?? item.code;
  return item.code;
}

let observer: IntersectionObserver | null = null;

onMounted(() => {
  nextTick(() => {
    observer = new IntersectionObserver(
      (entries) => {
        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }
        if (bestEntry) {
          const idx = Number((bestEntry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) {
            activeIndex.value = idx;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: [0, 0.1, 0.5] },
    );
    sectionRefs.value.forEach((el) => {
      if (el) observer?.observe(el);
    });
  });
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div class="feature-showcase">
    <!-- Left: sticky feature navigation -->
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
            @click="scrollToFeature(idx)"
          >
            <span class="feature-showcase__nav-index">{{ idx + 1 }}</span>
            <span class="feature-showcase__nav-text">{{ item.title }}</span>
            <span v-if="item.badge" class="feature-showcase__nav-badge">{{ item.badge }}</span>
          </li>
        </ul>
      </div>
    </aside>

    <!-- Right: demo content -->
    <div class="feature-showcase__content">
      <section
        v-for="(item, idx) in features"
        :key="idx"
        :ref="(el) => setSectionRef(el as HTMLElement | null, idx)"
        :data-index="idx"
        class="feature-showcase__section"
      >
        <div class="feature-showcase__section-header">
          <h3 :id="`feature-${idx}`" class="feature-showcase__section-title">
            <span class="feature-showcase__section-number">{{ idx + 1 }}</span>
            {{ item.title }}
          </h3>
          <p v-if="item.description" class="feature-showcase__section-desc">
            {{ item.description }}
          </p>
        </div>

        <!-- Demo preview -->
        <div class="feature-showcase__preview">
          <slot :name="`demo-${idx}`" />
        </div>

        <!-- Code toggle -->
        <div class="feature-showcase__actions">
          <button class="feature-showcase__toggle" @click="toggleCode(idx)">
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
            <span>{{ showCode[idx] ? '收起代码' : '查看代码' }}</span>
          </button>
        </div>

        <!-- Code panel -->
        <Transition name="fs-slide">
          <div v-if="showCode[idx]" class="feature-showcase__code-panel">
            <div class="feature-showcase__tabs">
              <button
                :class="[
                  'feature-showcase__tab',
                  { 'feature-showcase__tab--active': (activeTab[idx] ?? 'vue3') === 'vue3' },
                ]"
                @click="switchTab(idx, 'vue3')"
              >
                Vue 3
              </button>
              <button
                v-if="item.codeVue2"
                :class="[
                  'feature-showcase__tab',
                  { 'feature-showcase__tab--active': activeTab[idx] === 'vue2' },
                ]"
                @click="switchTab(idx, 'vue2')"
              >
                Vue 2
              </button>
              <button
                v-if="item.codeReact"
                :class="[
                  'feature-showcase__tab',
                  { 'feature-showcase__tab--active': activeTab[idx] === 'react' },
                ]"
                @click="switchTab(idx, 'react')"
              >
                React
              </button>
            </div>
            <div class="feature-showcase__code">
              <pre><code>{{ getCode(item, idx) }}</code></pre>
            </div>
          </div>
        </Transition>
      </section>
    </div>
  </div>
</template>
