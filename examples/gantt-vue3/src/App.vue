<script setup lang="ts">
import type { AxisRangePlanInput, BarSpec } from '@chronixjs/gantt';
import { ChronixGantt, useGanttSelection } from '@chronixjs/gantt-vue3';
import type {
  BarClickPayload,
  BarDragStartPayload,
  BarDragStopPayload,
  BarDropPayload,
  BarProgressPayload,
  BarResizePayload,
  BarResizeStartPayload,
  BarResizeStopPayload,
  ColumnSpec,
  EmptyAreaClickPayload,
  SelectPayload,
} from '@chronixjs/gantt-vue3';
import { computed, ref } from 'vue';

import { sampleBars, sampleLinks, sampleRows, todayLocalMidnight } from './sample-data';

type ViewId = AxisRangePlanInput['viewId'];

const VIEW_TOGGLE: readonly { readonly id: ViewId; readonly label: string }[] = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'season', label: '季' },
  { id: 'halfYear', label: '半年' },
  { id: 'year', label: '年' },
];

// Resource-panel column descriptors. Three columns demonstrate
// Phase 5.x's vGrouping rowspan merge: 地区 + 基地 are flagged
// `group: true` so consecutive rows that share their value collapse
// into one cell (海口 across the first three rows, 海口基地 across
// the first two). 车间 is the leaf column with one cell per row.
const columns: readonly ColumnSpec[] = [
  { key: 'region', label: '地区', width: 60, group: true },
  { key: 'base', label: '基地', width: 100, group: true },
  { key: 'name', label: '车间', width: 80 },
];

// Reactive copy of the bar set — drag / resize results mutate this in
// place so the demo shows a real end-to-end round-trip (commit →
// re-layout → re-render).
const bars = ref<BarSpec[]>(sampleBars.map((b) => ({ ...b })));
const editable = ref(true);
const selectable = ref(true);
const viewId = ref<ViewId>('day');

interface DemoEvent {
  readonly id: number;
  readonly kind:
    | 'bar-drop'
    | 'bar-resize'
    | 'select'
    | 'bar-progress'
    | 'bar-click'
    | 'empty-area-click'
    | 'bar-dragstart'
    | 'bar-dragstop'
    | 'bar-resizestart'
    | 'bar-resizestop';
  readonly detail: string;
}
const events = ref<DemoEvent[]>([]);
let nextEventId = 0;

// Phase 12: selection helper. Default single + shift-toggle multi-select
// with auto-clear-on-empty-click. Bound below as :selected-bar-ids +
// @bar-click + @empty-area-click. The composable owns the state; the
// adapter is fully controlled via the prop.
const selection = useGanttSelection();

const axisInput = computed<AxisRangePlanInput>(() => ({
  viewId: viewId.value,
  anchorDate: todayLocalMidnight(),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
}));

function pushEvent(kind: DemoEvent['kind'], detail: string): void {
  events.value = [...events.value, { id: nextEventId++, kind, detail }].slice(-20);
}

function fmtRange(r: { start: Date; end: Date }): string {
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${fmt(r.start)}–${fmt(r.end)}`;
}

function onBarDrop(p: BarDropPayload): void {
  const idx = bars.value.findIndex((b) => b.id === p.barId);
  if (idx >= 0) {
    const existing = bars.value[idx]!;
    bars.value = [
      ...bars.value.slice(0, idx),
      { ...existing, range: p.newRange, rowId: p.newRowId },
      ...bars.value.slice(idx + 1),
    ];
  }
  const rowSuffix = p.newRowId !== p.oldRowId ? ` [${p.oldRowId} → ${p.newRowId}]` : '';
  pushEvent(
    'bar-drop',
    `${p.barId}: ${fmtRange(p.oldRange)} → ${fmtRange(p.newRange)}${rowSuffix}`,
  );
}

function onBarResize(p: BarResizePayload): void {
  const idx = bars.value.findIndex((b) => b.id === p.barId);
  if (idx >= 0) {
    const existing = bars.value[idx]!;
    bars.value = [
      ...bars.value.slice(0, idx),
      { ...existing, range: p.newRange },
      ...bars.value.slice(idx + 1),
    ];
  }
  pushEvent(
    'bar-resize',
    `${p.barId} (${p.edge}): ${fmtRange(p.oldRange)} → ${fmtRange(p.newRange)}`,
  );
}

function onSelect(p: SelectPayload): void {
  pushEvent('select', `${p.rowId}: ${fmtRange(p.range)}`);
}

function onBarClick(p: BarClickPayload): void {
  selection.handleBarClick(p);
  const mode = p.jsEvent.shiftKey ? '+shift' : 'single';
  pushEvent(
    'bar-click',
    `${p.barId} [${mode}] → selection: ${selection.selectedBarIds.value.join(', ') || '(none)'}`,
  );
}

function onEmptyAreaClick(p: EmptyAreaClickPayload): void {
  selection.handleEmptyAreaClick(p);
  pushEvent('empty-area-click', `${p.rowId ?? '(outside)'} → selection cleared`);
}

function onBarProgress(p: BarProgressPayload): void {
  const idx = bars.value.findIndex((b) => b.id === p.barId);
  if (idx >= 0) {
    const existing = bars.value[idx]!;
    const rounded = Math.round(p.newProgress);
    bars.value = [
      ...bars.value.slice(0, idx),
      { ...existing, progress: { ...(existing.progress ?? { value: 0 }), value: rounded } },
      ...bars.value.slice(idx + 1),
    ];
  }
  pushEvent(
    'bar-progress',
    `${p.barId}: ${Math.round(p.oldProgress)}% → ${Math.round(p.newProgress)}%`,
  );
}

function onBarDragStart(p: BarDragStartPayload): void {
  pushEvent('bar-dragstart', p.barId);
}

function onBarDragStop(p: BarDragStopPayload): void {
  pushEvent('bar-dragstop', p.barId);
}

function onBarResizeStart(p: BarResizeStartPayload): void {
  pushEvent('bar-resizestart', `${p.barId} (${p.edge})`);
}

function onBarResizeStop(p: BarResizeStopPayload): void {
  pushEvent('bar-resizestop', `${p.barId} (${p.edge})`);
}

function resetBars(): void {
  bars.value = sampleBars.map((b) => ({ ...b }));
  events.value = [];
  nextEventId = 0;
}
</script>

<template>
  <div class="cx-demo-app">
    <main class="cx-demo-main">
      <header class="cx-demo-header">
        <h1>@chronixjs/gantt-vue3 demo</h1>
        <div class="cx-demo-config">
          <div class="cx-demo-view-toggle" role="group" aria-label="timeline scale">
            <button
              v-for="view in VIEW_TOGGLE"
              :key="view.id"
              type="button"
              class="cx-demo-view-toggle-button"
              :class="{ active: viewId === view.id }"
              @click="viewId = view.id"
            >
              {{ view.label }}
            </button>
          </div>
          <label>
            <input v-model="editable" type="checkbox" />
            editable
          </label>
          <label>
            <input v-model="selectable" type="checkbox" />
            selectable
          </label>
          <button type="button" @click="resetBars">reset</button>
        </div>
      </header>
      <div class="cx-demo-svg-frame">
        <ChronixGantt
          :bars="bars"
          :rows="sampleRows"
          :axis-input="axisInput"
          :columns="columns"
          :links="sampleLinks"
          :selected-bar-ids="selection.selectedBarIds.value"
          :editable="editable"
          :selectable="selectable"
          @bar-drop="onBarDrop"
          @bar-resize="onBarResize"
          @select="onSelect"
          @bar-progress="onBarProgress"
          @bar-click="onBarClick"
          @empty-area-click="onEmptyAreaClick"
          @bar-dragstart="onBarDragStart"
          @bar-dragstop="onBarDragStop"
          @bar-resizestart="onBarResizeStart"
          @bar-resizestop="onBarResizeStop"
        />
      </div>
    </main>
    <aside class="cx-demo-side">
      <h2>events</h2>
      <ul v-if="events.length > 0" class="cx-demo-events">
        <li
          v-for="event in events"
          :key="event.id"
          class="cx-demo-event"
          :class="`kind-${event.kind}`"
        >
          <div class="cx-demo-event-kind">{{ event.kind }}</div>
          <div class="cx-demo-event-detail">{{ event.detail }}</div>
        </li>
      </ul>
      <div v-else class="cx-demo-empty">
        Drag a bar body to move, drag a bar edge to resize, or drag an empty row to select a range.
      </div>
      <footer class="cx-demo-footer">
        <code>{{ bars.length }}</code> bars across <code>{{ sampleRows.length }}</code> rows. Day
        axis from local midnight.
        <br />
        Commit events update the bar state in place — drag, then drag again to see the new baseline.
      </footer>
    </aside>
  </div>
</template>
