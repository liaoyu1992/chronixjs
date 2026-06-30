<template>
  <div class="cx-demo-app">
    <main class="cx-demo-main">
      <div v-if="cfg.parity.value" class="cx-demo-parity-banner" data-parity-mode="true">
        Parity mode active — sample data mirrors the original spec Vue 2 demo ({{
          bars.length
        }}
        bars × {{ rows.length }} rows). See <code>audit/PHASE_31_6_PARITY_VUE2_DESIGN.md</code>.
      </div>
      <header class="cx-demo-header">
        <h1>@chronixjs/gantt-vue2 demo</h1>
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
        <chronix-gantt
          ref="chartRef"
          :bars="bars"
          :rows="rows"
          :axis-input="axisInput"
          :columns="COLUMNS"
          :links="initialLinks"
          max-body-height="70vh"
          :sidebar-divider-width="cfg.dividerWidth.value"
          :selected-bar-ids="sel.selectedBarIds.value"
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
          @update:axisInput="onUpdateAxisInput"
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
        Phase 24/37: imperative-handle test-button bar. Positioned offscreen
        so Playwright can click via data-test-handle-method selector without
        the bar leaking into any captured VRT snapshot. Buttons drive the
        chart via the adapter's exposed GanttHandle.
      -->
      <div class="cx-demo-handle-test-bar" role="group" aria-label="Phase 24 handle tests">
        <button data-test-handle-method="next" @click="chartRef && chartRef.next()">
          handle.next()
        </button>
        <button data-test-handle-method="today" @click="chartRef && chartRef.today()">
          handle.today()
        </button>
        <button
          data-test-handle-method="changeView-month"
          @click="chartRef && chartRef.changeView('month')"
        >
          handle.changeView('month')
        </button>
        <button data-test-handle-method="scrollToDate" @click="onTestScrollToDate">
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
        <code>{{ bars.length }}</code> bars across <code>{{ rows.length }}</code> rows. Day axis
        from local midnight.
        <br />
        Commit events update the bar state in place — drag, then drag again to see the new baseline.
      </footer>
    </aside>
  </div>
</template>

<script lang="ts">
import { ChronixGantt, useGanttSelection, type ColumnSpec } from '@chronixjs/gantt-vue2';
import { computed, defineComponent, ref } from 'vue';

import { bool, describeConfigSchema, enumOf, num, useDemoConfig } from './demo-config.js';
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
} from './sample-callbacks.js';
import { initialSampleBars, sampleLinks, sampleRows, todayLocalMidnight } from './sample-data.js';
import {
  initialSampleBarsParityVue2,
  sampleLinksParityVue2,
  sampleRowsParityVue2,
} from './sample-data-parity-vue2.js';

import type {
  AxisRangePlanInput,
  BarColorFunc,
  BarSpec,
  EventAllowFunc,
  EventConstraint,
  EventOverlapFunc,
  SelectAllowFunc,
  TodayCellBgOption,
  TodayLineOption,
  ToolbarInput,
} from '@chronixjs/gantt';

type ViewId = AxisRangePlanInput['viewId'];

/**
 * **Phase 46: demo config schema** mirroring vue3's 12-toggle schema.
 *
 * Every toggle in the demo is one entry here. Adding a new
 * Phase-21+ toggle = 1 line (`newToggle: bool(false, '...')`)
 * + bind it in the template + read it in the appropriate
 * `computed` for `<chronix-gantt>` props. URL is source of
 * truth: `?editable=false&priorityCallback=true&...`.
 *
 * The `<details>` panel at page bottom is auto-rendered from
 * this schema (no hand-maintained URL docs).
 */
const DEMO_SCHEMA = {
  view: enumOf<ViewId>(
    ['day', 'week', 'month', 'season', 'halfYear', 'year'],
    'week',
    'Initial timeline view',
  ),
  editable: bool(true, 'Enable bar drag + edge resize'),
  selectable: bool(true, 'Enable calendar range-select on empty rows'),
  parity: bool(
    false,
    'Swap demo data to the original spec Vue 2 dataset (11 resources × 9 events)',
  ),
  weekendsVisible: bool(true, 'Render Saturday + Sunday cells'),
  // Sidebar/chart divider gap (px). 0 removes the gap (and the resize handle).
  dividerWidth: num(4, 'Sidebar↔timeline divider width in px (0 = no gap)'),
  // Phase 19 validators
  eventOverlap: bool(false, 'Reject cross-row time-intersecting drops'),
  eventConstraint: bool(false, 'Constrain drag/resize destination to today 08:00–20:00'),
  eventAllow: bool(false, 'Reject drops/resizes whose start is before 08:00'),
  selectAllow: bool(false, 'Reject range-selects wider than 4 hours'),
  // Phase 20 bar styling
  themedBars: bool(false, 'Override bar bg + border via component props'),
  umbrellaColor: bool(false, 'Use barColor umbrella prop (sets both fill + stroke)'),
  priorityCallback: bool(false, 'Per-priority bar background callback (high/medium/low)'),
  // Phase 21 today line (default ON to match original spec visible default)
  todayLine: bool(
    true,
    'Show vertical today-line with original spec defaults (red #ff6b6b, 2 px, dashed, 今日 tooltip)',
  ),
  // Phase 22.2 today cell bg
  todayCellBg: bool(true, 'Show today-column background tint (rgba(255, 220, 40, .15))'),
  // Phase 28.3 link rendering
  useLineEventColor: bool(false, 'Color dependency lines by source bar (Phase 28.3)'),
} as const;

// Phase 22 / 31.5.1: declarative headerToolbar DSL.
const HEADER_TOOLBAR: ToolbarInput = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,halfYear,year',
};

// Phase 49: resource-panel columns mirroring `examples/gantt-vue3/src/
// App.vue:105-109` + the react example. The first two columns are
// grouped (vGrouping) so consecutive rows that share the same region /
// base collapse into a single rowspan cell. `name` is the leaf column
// — one cell per row.
const COLUMNS: readonly ColumnSpec[] = [
  { key: 'region', label: '地区', width: 60, group: true },
  { key: 'base', label: '基地', width: 100, group: true },
  { key: 'name', label: '车间', width: 100 },
];

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

export default defineComponent({
  name: 'DemoApp',
  components: { ChronixGantt },
  setup() {
    const cfg = useDemoConfig(DEMO_SCHEMA);

    const initialBarsList: readonly BarSpec[] = cfg.parity.value
      ? initialSampleBarsParityVue2()
      : initialSampleBars();
    const rowsList = cfg.parity.value ? sampleRowsParityVue2 : sampleRows;
    const initialLinks = cfg.parity.value ? sampleLinksParityVue2 : sampleLinks;

    const bars = ref<BarSpec[]>(initialBarsList.map((b) => ({ ...b })));
    const rows = rowsList;

    // Phase 46: parity mode auto-enables priorityCallback when its
    // own URL flag is set so the cross-demo `useLineEventColor` /
    // `phase28.3` parity tests see matching colors. Independent from
    // the toggle UI (which is for default-mode users to flip live).
    const isPriorityCallbackParity = cfg.priorityCallback.value && cfg.parity.value;

    const events = ref<DemoEvent[]>([]);
    let nextEventId = 0;

    const sel = useGanttSelection();

    // Phase 22: anchorDate is a writable ref now (was hardcoded literal).
    // Handle methods like `prev()` / `next()` / `today()` emit `update:axisInput`
    // which our handler below extracts and writes back here, completing the
    // v-model:axis-input round-trip.
    const anchorDate = ref<Date>(todayLocalMidnight());

    // Phase 31.5: chartRef onto <chronix-gantt> for the exposed handle methods.
    const chartRef = ref<{
      prev: () => void;
      next: () => void;
      today: () => void;
      changeView: (viewId: ViewId) => void;
      scrollToDate: (date: Date) => void;
    } | null>(null);

    // ─── Computed validator + styling props passed to <chronix-gantt>. ───

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

    const activeTodayLine = computed<TodayLineOption | false>(() => {
      if (cfg.parity.value) return {};
      if (cfg.todayLine.value) return {};
      return false;
    });

    const activeTodayCellBg = computed<TodayCellBgOption | false>(() => {
      if (cfg.parity.value) return {};
      if (cfg.todayCellBg.value) return {};
      return false;
    });

    const axisInput = computed<AxisRangePlanInput>(() => ({
      viewId: cfg.view.value,
      anchorDate: anchorDate.value,
      viewportWidth: 1440,
      locale: 'zh-CN',
      weekendsVisible: cfg.weekendsVisible.value,
    }));

    // Toolbar two-way binding. The toolbar emits the full new `axisInput`;
    // the demo decomposes it back into the two reactive sources (`cfg.view`
    // URL-persisted, `anchorDate` local).
    function onUpdateAxisInput(next: AxisRangePlanInput): void {
      if (next.viewId !== cfg.view.value) cfg.view.value = next.viewId;
      if (next.anchorDate.getTime() !== anchorDate.value.getTime()) {
        anchorDate.value = next.anchorDate;
      }
    }

    // Phase 24: fixed scroll target one day after the anchor — gives the
    // cross-demo parity assertion a deterministic destination that exists in
    // every view's axis window without depending on the live "today" date.
    function onTestScrollToDate(): void {
      const t = new Date(anchorDate.value);
      t.setDate(t.getDate() + 1);
      chartRef.value?.scrollToDate(t);
    }

    const schemaDocs = describeConfigSchema(DEMO_SCHEMA);

    function pushEvent(kind: DemoEvent['kind'], detail: string): void {
      events.value = [...events.value, { id: nextEventId++, kind, detail }].slice(-20);
    }

    function fmtRange(r: { start: Date; end: Date }): string {
      const fmt = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return `${fmt(r.start)}–${fmt(r.end)}`;
    }

    function onBarDrop(p: {
      barId: string;
      oldRange: { start: Date; end: Date };
      newRange: { start: Date; end: Date };
      oldRowId: string;
      newRowId: string;
    }): void {
      const idx = bars.value.findIndex((b) => b.id === p.barId);
      if (idx >= 0) {
        const existing = bars.value[idx]!;
        bars.value.splice(idx, 1, { ...existing, range: p.newRange, rowId: p.newRowId });
      }
      const rowSuffix = p.newRowId !== p.oldRowId ? ` [${p.oldRowId} → ${p.newRowId}]` : '';
      pushEvent(
        'bar-drop',
        `${p.barId}: ${fmtRange(p.oldRange)} → ${fmtRange(p.newRange)}${rowSuffix}`,
      );
    }

    function onBarResize(p: {
      barId: string;
      edge: string;
      oldRange: { start: Date; end: Date };
      newRange: { start: Date; end: Date };
    }): void {
      const idx = bars.value.findIndex((b) => b.id === p.barId);
      if (idx >= 0) {
        const existing = bars.value[idx]!;
        bars.value.splice(idx, 1, { ...existing, range: p.newRange });
      }
      pushEvent(
        'bar-resize',
        `${p.barId} (${p.edge}): ${fmtRange(p.oldRange)} → ${fmtRange(p.newRange)}`,
      );
    }

    function onSelect(p: { rowId: string; range: { start: Date; end: Date } }): void {
      pushEvent('select', `${p.rowId}: ${fmtRange(p.range)}`);
    }

    function onBarClick(p: { barId: string; sourceBar: BarSpec; jsEvent: PointerEvent }): void {
      sel.handleBarClick(p);
      const mode = p.jsEvent.shiftKey ? '+shift' : 'single';
      pushEvent(
        'bar-click',
        `${p.barId} [${mode}] → selection: ${sel.selectedBarIds.value.join(', ') || '(none)'}`,
      );
    }

    function onEmptyAreaClick(p: {
      rowId: string | null;
      jsEvent: PointerEvent;
      // Phase 54 — `time` field added; demo passes the payload through
      // verbatim so `time` propagates to `useGanttSelection`.
      time: Date;
    }): void {
      sel.handleEmptyAreaClick(p);
      pushEvent('empty-area-click', `${p.rowId ?? '(outside)'} → selection cleared`);
    }

    function onBarProgress(p: { barId: string; oldProgress: number; newProgress: number }): void {
      const idx = bars.value.findIndex((b) => b.id === p.barId);
      if (idx >= 0) {
        const existing = bars.value[idx]!;
        const rounded = Math.round(p.newProgress);
        bars.value.splice(idx, 1, {
          ...existing,
          progress: { ...(existing.progress ?? { value: 0 }), value: rounded },
        });
      }
      pushEvent(
        'bar-progress',
        `${p.barId}: ${Math.round(p.oldProgress)}% → ${Math.round(p.newProgress)}%`,
      );
    }

    function onBarDragStart(p: { barId: string }): void {
      pushEvent('bar-dragstart', p.barId);
    }

    function onBarDragStop(p: { barId: string }): void {
      pushEvent('bar-dragstop', p.barId);
    }

    function onBarResizeStart(p: { barId: string; edge: string }): void {
      pushEvent('bar-resizestart', `${p.barId} (${p.edge})`);
    }

    function onBarResizeStop(p: { barId: string; edge: string }): void {
      pushEvent('bar-resizestop', `${p.barId} (${p.edge})`);
    }

    function onBarDropRejected(p: {
      barId: string;
      oldRange: { start: Date; end: Date };
      attemptedRange: { start: Date; end: Date };
      reason: string;
    }): void {
      pushEvent(
        'bar-drop-rejected',
        `${p.barId}: ${fmtRange(p.oldRange)} → ${fmtRange(p.attemptedRange)} blocked by ${p.reason}`,
      );
    }

    function onBarResizeRejected(p: {
      barId: string;
      edge: string;
      oldRange: { start: Date; end: Date };
      attemptedRange: { start: Date; end: Date };
      reason: string;
    }): void {
      pushEvent(
        'bar-resize-rejected',
        `${p.barId} (${p.edge}): ${fmtRange(p.oldRange)} → ${fmtRange(p.attemptedRange)} blocked by ${p.reason}`,
      );
    }

    function onSelectRejected(p: {
      rowId: string;
      attemptedRange: { start: Date; end: Date };
      reason: string;
    }): void {
      pushEvent(
        'select-rejected',
        `${p.rowId}: ${fmtRange(p.attemptedRange)} blocked by ${p.reason}`,
      );
    }

    function resetBars(): void {
      const fresh = cfg.parity.value ? initialSampleBarsParityVue2() : initialSampleBars();
      bars.value = fresh.map((b) => ({ ...b }));
      events.value = [];
      nextEventId = 0;
    }

    return {
      cfg,
      bars,
      rows,
      initialLinks,
      events,
      sel,
      schemaDocs,
      chartRef,
      HEADER_TOOLBAR,
      COLUMNS,
      axisInput,
      activeEventOverlap,
      activeEventConstraint,
      activeEventAllow,
      activeSelectAllow,
      activeBarColor,
      activeBarBackgroundColor,
      activeBarBorderColor,
      activeBarBackgroundCallback,
      activeTodayLine,
      activeTodayCellBg,
      onUpdateAxisInput,
      onTestScrollToDate,
      onBarDrop,
      onBarResize,
      onSelect,
      onBarProgress,
      onBarClick,
      onEmptyAreaClick,
      onBarDragStart,
      onBarDragStop,
      onBarResizeStart,
      onBarResizeStop,
      onBarDropRejected,
      onBarResizeRejected,
      onSelectRejected,
      resetBars,
    };
  },
});
</script>
