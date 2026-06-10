<script setup lang="ts">
import type {
  AxisRangePlanInput,
  BarColorFunc,
  BarSpec,
  EventAllowFunc,
  EventConstraint,
  EventOverlapFunc,
  GanttHandle,
  SelectAllowFunc,
  TodayCellBgOption,
  TodayLineOption,
} from '@chronixjs/gantt';
import { ChronixGantt, useGanttSelection } from '@chronixjs/gantt-vue3';
import type {
  BarClickPayload,
  BarDragStartPayload,
  BarDragStopPayload,
  BarDropPayload,
  BarDropRejectedPayload,
  BarProgressPayload,
  BarResizePayload,
  BarResizeRejectedPayload,
  BarResizeStartPayload,
  BarResizeStopPayload,
  ColumnSpec,
  EmptyAreaClickPayload,
  SelectPayload,
  SelectRejectedPayload,
} from '@chronixjs/gantt-vue3';
import { computed, ref } from 'vue';

import { bool, describeConfigSchema, enumOf, useDemoConfig } from './demo-config';
import { sampleBars, sampleLinks, sampleRows, todayLocalMidnight } from './sample-data';
import { sampleBarsParity, sampleLinksParity, sampleRowsParity } from './sample-data-parity';
import {
  PARITY_REFERENCE_COLOR,
  THEMED_BAR_BACKGROUND,
  THEMED_BAR_BORDER,
  UMBRELLA_BAR_COLOR,
  sampleEventAllow,
  sampleEventConstraint,
  sampleEventOverlap,
  samplePriorityCallback,
  sampleSelectAllow,
} from './sample-callbacks';

type ViewId = AxisRangePlanInput['viewId'];

/**
 * **Phase 20.6: demo config schema.**
 *
 * Every toggle in the demo is one entry here. Adding a new
 * Phase-21+ toggle = 1 line (`newToggle: bool(false, '...')`)
 * + bind it in the template + read it in the appropriate
 * `computed` for `<ChronixGantt>` props. URL is source of
 * truth: `?editable=false&priorityCallback=true&...`.
 *
 * The `<details>` panel at page bottom is auto-rendered from
 * this schema (no hand-maintained URL docs).
 */
const DEMO_SCHEMA = {
  view: enumOf<ViewId>(
    ['day', 'week', 'month', 'season', 'halfYear', 'year'],
    'day',
    'Initial timeline view',
  ),
  editable: bool(true, 'Enable bar drag + edge resize'),
  selectable: bool(true, 'Enable calendar range-select on empty rows'),
  parity: bool(false, 'Swap demo data to the original spec dataset (32 resources × 25 events)'),
  // Phase 19 validators
  eventOverlap: bool(false, 'Reject cross-row time-intersecting drops'),
  eventConstraint: bool(false, 'Constrain drag/resize destination to today 08:00–20:00'),
  eventAllow: bool(false, 'Reject drops/resizes whose start is before 08:00'),
  selectAllow: bool(false, 'Reject range-selects wider than 4 hours'),
  // Phase 20 bar styling
  themedBars: bool(false, 'Override bar bg + border via component props'),
  umbrellaColor: bool(false, 'Use barColor umbrella prop (sets both fill + stroke)'),
  priorityCallback: bool(false, 'Per-priority bar background callback (high/medium/low)'),
  // Phase 21 today line (default ON Phase 22.2, matching original visible default)
  todayLine: bool(
    true,
    'Show vertical today-line with original spec defaults (red #ff6b6b, 2 px, dashed, 今日 tooltip)',
  ),
  // Phase 22.2 today cell bg (default ON matching original `todayBgColor`)
  todayCellBg: bool(true, 'Show today-column background tint (rgba(255, 220, 40, .15))'),
  // Phase 28.3 link rendering
  useLineEventColor: bool(false, 'Color dependency lines by source bar (Phase 28.3)'),
} as const;

const cfg = useDemoConfig(DEMO_SCHEMA);

const initialBars = cfg.parity.value ? sampleBarsParity : sampleBars;
const initialRows = cfg.parity.value ? sampleRowsParity : sampleRows;
// Phase 28.3.1: parity mode wires the curated 8-edge parity link set
// (`sampleLinksParity`) so cross-demo `useLineEventColor` assertions
// have a non-empty dependency graph to compare. Default (non-parity)
// mode keeps the original `sampleLinks` set.
const initialLinks = cfg.parity.value ? sampleLinksParity : sampleLinks;

// Resource-panel column descriptors. Three columns demonstrate
// Phase 5.x's vGrouping rowspan merge: 地区 + 基地 are flagged
// `group: true` so consecutive rows that share their value collapse
// into one cell.
const columns: readonly ColumnSpec[] = [
  { key: 'region', label: '地区', width: 60, group: true },
  { key: 'base', label: '基地', width: 100, group: true },
  { key: 'name', label: '车间', width: 80 },
];

// Reactive copy of the bar set — drag / resize commits mutate this in
// place so the demo shows a real end-to-end round-trip.
const bars = ref<BarSpec[]>(initialBars.map((b) => ({ ...b })));

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
    | 'bar-resizestop'
    | 'bar-drop-rejected'
    | 'bar-resize-rejected'
    | 'select-rejected';
  readonly detail: string;
}
const events = ref<DemoEvent[]>([]);
let nextEventId = 0;

// Phase 12: selection helper. Default single + shift-toggle multi-select
// with auto-clear-on-empty-click.
const selection = useGanttSelection();

// `?priorityCallback=true` is wired in parity mode so the cross-demo
// color parity test has matching colors. Independent from the
// toggle UI (which is for default mode users to flip live).
const isPriorityCallbackParity = cfg.priorityCallback.value && cfg.parity.value;

// ─── Computed validator + styling props passed to <ChronixGantt>. ───
//
// Each is `undefined` when the toggle is off so the gate stays
// inactive. Parity mode pins specific styling values so the
// cross-demo color parity tests have deterministic baselines.

const activeEventOverlap = computed<boolean | EventOverlapFunc | undefined>(() =>
  cfg.eventOverlap.value ? sampleEventOverlap : undefined,
);
const activeEventConstraint = computed<EventConstraint | undefined>(() =>
  cfg.eventConstraint.value ? sampleEventConstraint : undefined,
);
const activeEventAllow = computed<EventAllowFunc | undefined>(() =>
  cfg.eventAllow.value ? sampleEventAllow : undefined,
);
const activeSelectAllow = computed<SelectAllowFunc | undefined>(() =>
  cfg.selectAllow.value ? sampleSelectAllow : undefined,
);

const activeBarBackgroundColor = computed<string | undefined>(() => {
  if (cfg.parity.value) return PARITY_REFERENCE_COLOR;
  if (cfg.themedBars.value) return THEMED_BAR_BACKGROUND;
  return undefined;
});
const activeBarBorderColor = computed<string | undefined>(() => {
  if (cfg.parity.value) return PARITY_REFERENCE_COLOR;
  if (cfg.themedBars.value) return THEMED_BAR_BORDER;
  return undefined;
});
const activeBarColor = computed<string | undefined>(() =>
  cfg.umbrellaColor.value ? UMBRELLA_BAR_COLOR : undefined,
);
const activeBarBackgroundCallback = computed<BarColorFunc | undefined>(() => {
  if (isPriorityCallbackParity) return samplePriorityCallback;
  if (cfg.priorityCallback.value) return samplePriorityCallback;
  return undefined;
});

// Phase 21: parity mode auto-enables the today-line so cross-demo
// screenshots match the original default visible state
// (its demo turns todayLine on by default). Standalone `?todayLine=true`
// flag still works in non-parity mode for chronix users to see the
// feature without flipping the parity dataset. Empty-object form
// `{}` resolves to all chronix-defaults (#ff6b6b / 2 / dashed / 今日)
// — matching the original spec defaults byte-for-byte.
const activeTodayLine = computed<TodayLineOption | false>(() => {
  if (cfg.parity.value) return {};
  if (cfg.todayLine.value) return {};
  return false;
});

// Phase 22.2: parity mode auto-enables today-cell-bg so cross-demo
// screenshots match the original default visible state.
// Standalone `?todayCellBg=true` flag still works for chronix-only
// users to opt in without flipping the parity dataset.
const activeTodayCellBg = computed<TodayCellBgOption | false>(() => {
  if (cfg.parity.value) return {};
  if (cfg.todayCellBg.value) return {};
  return false;
});

// Phase 22: anchorDate becomes a local-ref so toolbar nav buttons
// (prev / next / today) can shift it via `update:axisInput`. URL
// persistence stays scoped to `cfg.view` (Phase 20.6 schema field) —
// anchor-date URL persistence is deferred to a future i18n / date-
// URL phase. Seeded at module-load with today's local midnight.
const anchorDate = ref<Date>(todayLocalMidnight());

// Phase 24: imperative-handle ref. Demo binds it via the `ref` template
// attr below; the Phase-24 test-button bar invokes methods on it. The
// chart re-renders via the normal `v-model:axis-input` round-trip
// (compute-and-emit pathway documented in PHASE_24_IMPERATIVE_HANDLE_DESIGN).
const ganttRef = ref<GanttHandle | null>(null);

// Phase 24: fixed scroll target one day after the anchor — gives the
// cross-demo parity assertion a deterministic destination that exists in
// every view's axis window without depending on the live "today" date.
function scrollTargetDate(): Date {
  const t = new Date(anchorDate.value);
  t.setDate(t.getDate() + 1);
  return t;
}

const axisInput = computed<AxisRangePlanInput>(() => ({
  viewId: cfg.view.value,
  anchorDate: anchorDate.value,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
}));

// Phase 22: toolbar two-way binding. The toolbar emits the full new
// `axisInput`; the demo decomposes it back into the two reactive
// sources (`cfg.view` URL-persisted, `anchorDate` local).
function onUpdateAxisInput(next: AxisRangePlanInput): void {
  cfg.view.value = next.viewId;
  anchorDate.value = next.anchorDate;
}

// Phase 22: original spec headerToolbar wiring. Three nav buttons +
// a title + six view-toggle buttons, matching the original spec
// demo's `headerToolbar` shape (see DemoApp.vue:1346-1350).
const HEADER_TOOLBAR = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,halfYear,year',
} as const;

const schemaDocs = describeConfigSchema(DEMO_SCHEMA);

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

function onBarDropRejected(p: BarDropRejectedPayload): void {
  pushEvent(
    'bar-drop-rejected',
    `${p.barId}: ${fmtRange(p.oldRange)} → ${fmtRange(p.attemptedRange)} blocked by ${p.reason}`,
  );
}

function onBarResizeRejected(p: BarResizeRejectedPayload): void {
  pushEvent(
    'bar-resize-rejected',
    `${p.barId} (${p.edge}): ${fmtRange(p.oldRange)} → ${fmtRange(p.attemptedRange)} blocked by ${p.reason}`,
  );
}

function onSelectRejected(p: SelectRejectedPayload): void {
  pushEvent('select-rejected', `${p.rowId}: ${fmtRange(p.attemptedRange)} blocked by ${p.reason}`);
}

function resetBars(): void {
  bars.value = initialBars.map((b) => ({ ...b }));
  events.value = [];
  nextEventId = 0;
}
</script>

<template>
  <div class="cx-demo-app">
    <main class="cx-demo-main">
      <div v-if="cfg.parity.value" class="cx-demo-parity-banner" data-parity-mode="true">
        Parity mode active — sample data mirrors the original spec demo ({{
          initialBars.length
        }}
        bars × {{ initialRows.length }} rows). See
        <code>audit/PHASE_17_PARITY_INFRASTRUCTURE_DESIGN.md</code>.
      </div>
      <header class="cx-demo-header">
        <h1>@chronixjs/gantt-vue3 demo</h1>
        <div class="cx-demo-config">
          <label>
            <input v-model="cfg.editable.value" type="checkbox" />
            editable
          </label>
          <label>
            <input v-model="cfg.selectable.value" type="checkbox" />
            selectable
          </label>
          <button type="button" @click="resetBars">reset</button>
        </div>
        <div class="cx-demo-validation-toggles" role="group" aria-label="validation gates">
          <span class="cx-demo-validation-label">validation (Phase 19):</span>
          <label title="Reject cross-row time-intersecting drops">
            <input v-model="cfg.eventOverlap.value" type="checkbox" />
            eventOverlap: false
          </label>
          <label title="Constrain drag/resize destination to today 08:00–20:00">
            <input v-model="cfg.eventConstraint.value" type="checkbox" />
            eventConstraint
          </label>
          <label title="Reject drops/resizes that start before 08:00">
            <input v-model="cfg.eventAllow.value" type="checkbox" />
            eventAllow ≥ 8am
          </label>
          <label title="Reject range-selects wider than 4 hours">
            <input v-model="cfg.selectAllow.value" type="checkbox" />
            selectAllow ≤ 4h
          </label>
        </div>
        <div class="cx-demo-validation-toggles" role="group" aria-label="bar styling">
          <span class="cx-demo-validation-label">bar styling (Phase 20):</span>
          <label title="barBackgroundColor + barBorderColor at component level">
            <input v-model="cfg.themedBars.value" type="checkbox" />
            themed bars
          </label>
          <label title="barColor umbrella sets both fill + stroke">
            <input v-model="cfg.umbrellaColor.value" type="checkbox" />
            umbrella color
          </label>
          <label title="barBackgroundColorCallback: per-priority colors via extendedProps">
            <input v-model="cfg.priorityCallback.value" type="checkbox" />
            priority callback
          </label>
        </div>
      </header>
      <div class="cx-demo-svg-frame">
        <ChronixGantt
          ref="ganttRef"
          :bars="bars"
          :rows="initialRows"
          :axis-input="axisInput"
          :columns="columns"
          :links="initialLinks"
          max-body-height="70vh"
          :selected-bar-ids="selection.selectedBarIds.value"
          :editable="cfg.editable.value"
          :selectable="cfg.selectable.value"
          :event-overlap="activeEventOverlap"
          :event-constraint="activeEventConstraint"
          :event-allow="activeEventAllow"
          :select-allow="activeSelectAllow"
          :bar-color="activeBarColor"
          :bar-background-color="activeBarBackgroundColor"
          :bar-border-color="activeBarBorderColor"
          :bar-background-color-callback="activeBarBackgroundCallback"
          :today-line="activeTodayLine"
          :today-cell-bg="activeTodayCellBg"
          :use-line-event-color="cfg.useLineEventColor.value"
          :header-toolbar="HEADER_TOOLBAR"
          @update:axis-input="onUpdateAxisInput"
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
          @bar-drop-rejected="onBarDropRejected"
          @bar-resize-rejected="onBarResizeRejected"
          @select-rejected="onSelectRejected"
        />
      </div>
      <!--
        Phase 24: imperative-handle test-button bar. Positioned offscreen
        (top: -9999px) so Playwright can click it without it leaking into
        any captured VRT snapshot. Each button drives the chart via the
        adapter's exposed `GanttHandle`; chart re-renders via the same
        compute-and-emit pathway the toolbar uses. Cross-demo parity
        assertions in tooling/golden-runner/tests/parity.spec.ts pair
        these against equivalent buttons on the original spec demo.
      -->
      <div class="cx-demo-handle-test-bar" role="group" aria-label="Phase 24 handle tests">
        <button data-test-handle-method="next" @click="ganttRef?.next()">handle.next()</button>
        <button data-test-handle-method="today" @click="ganttRef?.today()">handle.today()</button>
        <button data-test-handle-method="changeView-month" @click="ganttRef?.changeView('month')">
          handle.changeView('month')
        </button>
        <button
          data-test-handle-method="scrollToDate"
          @click="ganttRef?.scrollToDate(scrollTargetDate())"
        >
          handle.scrollToDate(anchor+1d)
        </button>
      </div>
      <details class="cx-demo-url-schema">
        <summary>URL flags ({{ schemaDocs.length }}) — shareable demo links</summary>
        <table>
          <thead>
            <tr>
              <th>flag</th>
              <th>default</th>
              <th>description</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in schemaDocs" :key="row.key">
              <td>
                <code>?{{ row.key }}=…</code>
              </td>
              <td>
                <code>{{ row.defaultValue }}</code>
              </td>
              <td>{{ row.description }}</td>
            </tr>
          </tbody>
        </table>
        <p>
          Toggle a checkbox → URL updates with non-default flags so the resulting link is shareable
          + reload-safe. Reset to default → key strips from URL.
        </p>
      </details>
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
        <code>{{ bars.length }}</code> bars across <code>{{ initialRows.length }}</code> rows. Day
        axis from local midnight.
        <br />
        Commit events update the bar state in place — drag, then drag again to see the new baseline.
      </footer>
    </aside>
  </div>
</template>
