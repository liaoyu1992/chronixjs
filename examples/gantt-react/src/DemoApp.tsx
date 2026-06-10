import {
  type AxisRangePlanInput,
  type BarColorFunc,
  type BarSpec,
  type EventAllowFunc,
  type EventConstraint,
  type EventOverlapFunc,
  type GanttHandle,
  type SelectAllowFunc,
  type TodayCellBgOption,
  type TodayLineOption,
  type ToolbarInput,
  type ViewId,
} from '@chronixjs/gantt';
import {
  ChronixGantt,
  useGanttSelection,
  type BarClickPayload,
  type BarDragStartCallback,
  type BarDragStopCallback,
  type BarDropPayload,
  type BarDropRejectedPayload,
  type BarProgressPayload,
  type BarResizePayload,
  type BarResizeRejectedPayload,
  type BarResizeStartCallback,
  type BarResizeStopCallback,
  type ColumnSpec,
  type EmptyAreaClickPayload,
  type SelectPayload,
  type SelectRejectedPayload,
} from '@chronixjs/gantt-react';
import { useMemo, useRef, useState, type FC } from 'react';

import { bool, describeConfigSchema, enumOf, useDemoConfig } from './demo-config.js';
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
import { sampleBarsParity, sampleLinksParity, sampleRowsParity } from './sample-data-parity.js';
import { initialSampleBars, sampleLinks, sampleRows, todayLocalMidnight } from './sample-data.js';

/**
 * **Phase 46: demo config schema** for the chronix-react demo. Mirror of
 * `examples/gantt-vue3/src/App.vue` `DEMO_SCHEMA`. Every toggle in the
 * demo is one entry; URL is source of truth.
 */
const DEMO_SCHEMA = {
  view: enumOf<ViewId>(
    ['day', 'week', 'month', 'season', 'halfYear', 'year'],
    'week',
    'Initial timeline view',
  ),
  editable: bool(true, 'Enable bar drag + edge resize'),
  selectable: bool(true, 'Enable calendar range-select on empty rows'),
  parity: bool(false, 'Swap demo data to the original spec dataset (32 resources × 25 events)'),
  weekendsVisible: bool(true, 'Render Saturday + Sunday cells'),
  eventOverlap: bool(false, 'Reject cross-row time-intersecting drops'),
  eventConstraint: bool(false, 'Constrain drag/resize destination to today 08:00–20:00'),
  eventAllow: bool(false, 'Reject drops/resizes whose start is before 08:00'),
  selectAllow: bool(false, 'Reject range-selects wider than 4 hours'),
  themedBars: bool(false, 'Override bar bg + border via component props'),
  umbrellaColor: bool(false, 'Use barColor umbrella prop (sets both fill + stroke)'),
  priorityCallback: bool(false, 'Per-priority bar background callback (high/medium/low)'),
  todayLine: bool(
    true,
    'Show vertical today-line with original spec defaults (red #ff6b6b, 2 px, dashed, 今日 tooltip)',
  ),
  todayCellBg: bool(true, 'Show today-column background tint (rgba(255, 220, 40, .15))'),
  useLineEventColor: bool(false, 'Color dependency lines by source bar (Phase 28.3)'),
} as const;

// Phase 22 / 34: declarative headerToolbar DSL.
const HEADER_TOOLBAR: ToolbarInput = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,halfYear,year',
};

// Phase 48: resource-panel columns mirroring `examples/gantt-vue3/src/
// App.vue:105-109`. The first two columns are grouped (vGrouping) so
// consecutive rows that share the same region / base collapse into a
// single rowspan cell. `name` is the leaf column — one cell per row.
const COLUMNS: readonly ColumnSpec[] = [
  { key: 'region', label: '地区', width: 60, group: true },
  { key: 'base', label: '基地', width: 100, group: true },
  { key: 'name', label: '车间', width: 100 },
];

type DemoEventKind =
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

interface DemoEvent {
  readonly id: number;
  readonly kind: DemoEventKind;
  readonly detail: string;
}

function fmtRange(r: { start: Date; end: Date }): string {
  const fmt = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${fmt(r.start)}–${fmt(r.end)}`;
}

export const DemoApp: FC = () => {
  const cfg = useDemoConfig(DEMO_SCHEMA);

  // Pin the parity-mode dataset choice at mount via the `useState`
  // initializer; switching `?parity=true` mid-session requires a reload
  // to swap datasets (matching vue3's module-load `cfg.parity.value`
  // snapshot pattern). The 4 source arrays (parity/non-parity bars,
  // rows, links) are read once and frozen for the component's lifetime.
  const [initialBarsList] = useState<readonly BarSpec[]>(() =>
    cfg.values.parity ? sampleBarsParity : initialSampleBars(),
  );
  const [rowsList] = useState(() => (cfg.values.parity ? sampleRowsParity : sampleRows));
  const [linksList] = useState(() => (cfg.values.parity ? sampleLinksParity : sampleLinks));

  const [bars, setBars] = useState<readonly BarSpec[]>(() =>
    initialBarsList.map((b) => ({ ...b })),
  );
  const [events, setEvents] = useState<readonly DemoEvent[]>([]);
  const nextEventIdRef = useRef(0);

  const sel = useGanttSelection();

  const [anchorDate, setAnchorDate] = useState<Date>(() => todayLocalMidnight());

  const ganttRef = useRef<GanttHandle | null>(null);

  // Phase 46: parity mode auto-enables priorityCallback so the cross-demo
  // `useLineEventColor` parity test sees matching colors. Independent
  // from the toggle UI (which is for default-mode users to flip live).
  const isPriorityCallbackParity = cfg.values.priorityCallback && cfg.values.parity;

  // ─── Computed validator + styling props passed to <ChronixGantt>. ───

  const activeEventOverlap = useMemo<boolean | EventOverlapFunc | undefined>(
    () => (cfg.values.eventOverlap ? sampleEventOverlap : undefined),
    [cfg.values.eventOverlap],
  );
  const activeEventConstraint = useMemo<EventConstraint | undefined>(
    () => (cfg.values.eventConstraint ? sampleEventConstraint : undefined),
    [cfg.values.eventConstraint],
  );
  const activeEventAllow = useMemo<EventAllowFunc | undefined>(
    () => (cfg.values.eventAllow ? sampleEventAllow : undefined),
    [cfg.values.eventAllow],
  );
  const activeSelectAllow = useMemo<SelectAllowFunc | undefined>(
    () => (cfg.values.selectAllow ? sampleSelectAllow : undefined),
    [cfg.values.selectAllow],
  );

  const activeBarBackgroundColor = useMemo<string | undefined>(() => {
    if (cfg.values.parity) return PARITY_REFERENCE_COLOR;
    if (cfg.values.themedBars) return THEMED_BAR_BACKGROUND;
    return undefined;
  }, [cfg.values.parity, cfg.values.themedBars]);
  const activeBarBorderColor = useMemo<string | undefined>(() => {
    if (cfg.values.parity) return PARITY_REFERENCE_COLOR;
    if (cfg.values.themedBars) return THEMED_BAR_BORDER;
    return undefined;
  }, [cfg.values.parity, cfg.values.themedBars]);
  const activeBarColor = useMemo<string | undefined>(
    () => (cfg.values.umbrellaColor ? UMBRELLA_BAR_COLOR : undefined),
    [cfg.values.umbrellaColor],
  );
  const activeBarBackgroundCallback = useMemo<BarColorFunc | undefined>(() => {
    if (isPriorityCallbackParity) return samplePriorityCallback;
    if (cfg.values.priorityCallback) return samplePriorityCallback;
    return undefined;
  }, [cfg.values.priorityCallback, isPriorityCallbackParity]);

  const activeTodayLine = useMemo<TodayLineOption | false>(() => {
    if (cfg.values.parity) return {};
    if (cfg.values.todayLine) return {};
    return false;
  }, [cfg.values.parity, cfg.values.todayLine]);

  const activeTodayCellBg = useMemo<TodayCellBgOption | false>(() => {
    if (cfg.values.parity) return {};
    if (cfg.values.todayCellBg) return {};
    return false;
  }, [cfg.values.parity, cfg.values.todayCellBg]);

  const axisInput = useMemo<AxisRangePlanInput>(
    () => ({
      viewId: cfg.values.view,
      anchorDate,
      viewportWidth: 1440,
      locale: 'zh-CN',
      weekendsVisible: cfg.values.weekendsVisible,
    }),
    [cfg.values.view, anchorDate, cfg.values.weekendsVisible],
  );

  function onAxisInputChange(next: AxisRangePlanInput): void {
    if (next.viewId !== cfg.values.view) cfg.setters.view(next.viewId);
    if (next.anchorDate.getTime() !== anchorDate.getTime()) setAnchorDate(next.anchorDate);
  }

  function scrollTargetDate(): Date {
    const t = new Date(anchorDate);
    t.setDate(t.getDate() + 1);
    return t;
  }

  const schemaDocs = describeConfigSchema(DEMO_SCHEMA);

  function pushEvent(kind: DemoEventKind, detail: string): void {
    setEvents((prev) => {
      const next = [...prev, { id: nextEventIdRef.current++, kind, detail }];
      return next.slice(-20);
    });
  }

  function onBarDrop(p: BarDropPayload): void {
    setBars((prev) =>
      prev.map((b) => (b.id === p.barId ? { ...b, range: p.newRange, rowId: p.newRowId } : b)),
    );
    const rowSuffix = p.newRowId !== p.oldRowId ? ` [${p.oldRowId} → ${p.newRowId}]` : '';
    pushEvent(
      'bar-drop',
      `${p.barId}: ${fmtRange(p.oldRange)} → ${fmtRange(p.newRange)}${rowSuffix}`,
    );
  }

  function onBarResize(p: BarResizePayload): void {
    setBars((prev) => prev.map((b) => (b.id === p.barId ? { ...b, range: p.newRange } : b)));
    pushEvent(
      'bar-resize',
      `${p.barId} (${p.edge}): ${fmtRange(p.oldRange)} → ${fmtRange(p.newRange)}`,
    );
  }

  function onSelect(p: SelectPayload): void {
    pushEvent('select', `${p.rowId}: ${fmtRange(p.range)}`);
  }

  function onBarProgress(p: BarProgressPayload): void {
    setBars((prev) =>
      prev.map((b) =>
        b.id === p.barId
          ? {
              ...b,
              progress: {
                ...(b.progress ?? { value: 0 }),
                value: Math.round(p.newProgress),
              },
            }
          : b,
      ),
    );
    pushEvent(
      'bar-progress',
      `${p.barId}: ${Math.round(p.oldProgress)}% → ${Math.round(p.newProgress)}%`,
    );
  }

  function onBarClick(p: BarClickPayload): void {
    sel.handleBarClick(p);
    const mode = p.jsEvent.shiftKey ? '+shift' : 'single';
    pushEvent(
      'bar-click',
      `${p.barId} [${mode}] → selection: ${sel.selectedBarIds.join(', ') || '(none)'}`,
    );
  }

  function onEmptyAreaClick(p: EmptyAreaClickPayload): void {
    sel.handleEmptyAreaClick(p);
    pushEvent('empty-area-click', `${p.rowId ?? '(outside)'} → selection cleared`);
  }

  function onBarDragStart(p: BarDragStartCallback): void {
    pushEvent('bar-dragstart', p.barId);
  }

  function onBarDragStop(p: BarDragStopCallback): void {
    pushEvent('bar-dragstop', p.barId);
  }

  function onBarResizeStart(p: BarResizeStartCallback): void {
    pushEvent('bar-resizestart', `${p.barId} (${p.edge})`);
  }

  function onBarResizeStop(p: BarResizeStopCallback): void {
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
    pushEvent(
      'select-rejected',
      `${p.rowId}: ${fmtRange(p.attemptedRange)} blocked by ${p.reason}`,
    );
  }

  function resetBars(): void {
    setBars(initialBarsList.map((b) => ({ ...b })));
    setEvents([]);
    nextEventIdRef.current = 0;
  }

  return (
    <div className="cx-demo-app">
      <main className="cx-demo-main">
        {cfg.values.parity ? (
          <div className="cx-demo-parity-banner" data-parity-mode="true">
            Parity mode active — sample data mirrors the original spec demo ({bars.length} bars ×{' '}
            {rowsList.length} rows). See <code>audit/PHASE_17_PARITY_INFRASTRUCTURE_DESIGN.md</code>
            .
          </div>
        ) : null}
        <header className="cx-demo-header">
          <h1>@chronixjs/gantt-react demo</h1>
          <div className="cx-demo-config">
            <label>
              <input
                type="checkbox"
                checked={cfg.values.editable}
                onChange={(e) => cfg.setters.editable(e.target.checked)}
              />
              editable
            </label>
            <label>
              <input
                type="checkbox"
                checked={cfg.values.selectable}
                onChange={(e) => cfg.setters.selectable(e.target.checked)}
              />
              selectable
            </label>
            <button type="button" onClick={resetBars}>
              reset
            </button>
          </div>
          <div className="cx-demo-validation-toggles" role="group" aria-label="validation gates">
            <span className="cx-demo-validation-label">validation (Phase 19):</span>
            <label title="Reject cross-row time-intersecting drops">
              <input
                type="checkbox"
                checked={cfg.values.eventOverlap}
                onChange={(e) => cfg.setters.eventOverlap(e.target.checked)}
              />
              eventOverlap: false
            </label>
            <label title="Constrain drag/resize destination to today 08:00–20:00">
              <input
                type="checkbox"
                checked={cfg.values.eventConstraint}
                onChange={(e) => cfg.setters.eventConstraint(e.target.checked)}
              />
              eventConstraint
            </label>
            <label title="Reject drops/resizes that start before 08:00">
              <input
                type="checkbox"
                checked={cfg.values.eventAllow}
                onChange={(e) => cfg.setters.eventAllow(e.target.checked)}
              />
              eventAllow ≥ 8am
            </label>
            <label title="Reject range-selects wider than 4 hours">
              <input
                type="checkbox"
                checked={cfg.values.selectAllow}
                onChange={(e) => cfg.setters.selectAllow(e.target.checked)}
              />
              selectAllow ≤ 4h
            </label>
          </div>
          <div className="cx-demo-validation-toggles" role="group" aria-label="bar styling">
            <span className="cx-demo-validation-label">bar styling (Phase 20):</span>
            <label title="barBackgroundColor + barBorderColor at component level">
              <input
                type="checkbox"
                checked={cfg.values.themedBars}
                onChange={(e) => cfg.setters.themedBars(e.target.checked)}
              />
              themed bars
            </label>
            <label title="barColor umbrella sets both fill + stroke">
              <input
                type="checkbox"
                checked={cfg.values.umbrellaColor}
                onChange={(e) => cfg.setters.umbrellaColor(e.target.checked)}
              />
              umbrella color
            </label>
            <label title="barBackgroundColorCallback: per-priority colors via extendedProps">
              <input
                type="checkbox"
                checked={cfg.values.priorityCallback}
                onChange={(e) => cfg.setters.priorityCallback(e.target.checked)}
              />
              priority callback
            </label>
          </div>
        </header>
        <div className="cx-demo-svg-frame">
          <ChronixGantt
            ref={ganttRef}
            bars={bars}
            rows={rowsList}
            axisInput={axisInput}
            columns={COLUMNS}
            links={linksList}
            maxBodyHeight="70vh"
            selectedBarIds={sel.selectedBarIds}
            editable={cfg.values.editable}
            selectable={cfg.values.selectable}
            {...(activeEventOverlap !== undefined ? { eventOverlap: activeEventOverlap } : {})}
            {...(activeEventConstraint !== undefined
              ? { eventConstraint: activeEventConstraint }
              : {})}
            {...(activeEventAllow !== undefined ? { eventAllow: activeEventAllow } : {})}
            {...(activeSelectAllow !== undefined ? { selectAllow: activeSelectAllow } : {})}
            {...(activeBarColor !== undefined ? { barColor: activeBarColor } : {})}
            {...(activeBarBackgroundColor !== undefined
              ? { barBackgroundColor: activeBarBackgroundColor }
              : {})}
            {...(activeBarBorderColor !== undefined
              ? { barBorderColor: activeBarBorderColor }
              : {})}
            {...(activeBarBackgroundCallback !== undefined
              ? { barBackgroundColorCallback: activeBarBackgroundCallback }
              : {})}
            todayLine={activeTodayLine}
            todayCellBg={activeTodayCellBg}
            useLineEventColor={cfg.values.useLineEventColor}
            headerToolbar={HEADER_TOOLBAR}
            onAxisInputChange={onAxisInputChange}
            onBarDrop={onBarDrop}
            onBarResize={onBarResize}
            onSelect={onSelect}
            onBarProgress={onBarProgress}
            onBarClick={onBarClick}
            onEmptyAreaClick={onEmptyAreaClick}
            onBarDragStart={onBarDragStart}
            onBarDragStop={onBarDragStop}
            onBarResizeStart={onBarResizeStart}
            onBarResizeStop={onBarResizeStop}
            onBarDropRejected={onBarDropRejected}
            onBarResizeRejected={onBarResizeRejected}
            onSelectRejected={onSelectRejected}
          />
        </div>
        {/*
          Phase 24: imperative-handle test-button bar. Positioned offscreen
          (top: -9999px) so Playwright can click it without it leaking into
          any captured VRT snapshot. Each button drives the chart via the
          adapter's exposed `GanttHandle`; chart re-renders via the same
          compute-and-emit pathway the toolbar uses.
        */}
        <div className="cx-demo-handle-test-bar" role="group" aria-label="Phase 24 handle tests">
          <button
            type="button"
            data-test-handle-method="next"
            onClick={() => ganttRef.current?.next()}
          >
            handle.next()
          </button>
          <button
            type="button"
            data-test-handle-method="today"
            onClick={() => ganttRef.current?.today()}
          >
            handle.today()
          </button>
          <button
            type="button"
            data-test-handle-method="changeView-month"
            onClick={() => ganttRef.current?.changeView('month')}
          >
            handle.changeView(&apos;month&apos;)
          </button>
          <button
            type="button"
            data-test-handle-method="scrollToDate"
            onClick={() => ganttRef.current?.scrollToDate(scrollTargetDate())}
          >
            handle.scrollToDate(anchor+1d)
          </button>
        </div>
        <details className="cx-demo-url-schema">
          <summary>URL flags ({schemaDocs.length}) — shareable demo links</summary>
          <table>
            <thead>
              <tr>
                <th>flag</th>
                <th>default</th>
                <th>description</th>
              </tr>
            </thead>
            <tbody>
              {schemaDocs.map((row) => (
                <tr key={row.key}>
                  <td>
                    <code>?{row.key}=…</code>
                  </td>
                  <td>
                    <code>{row.defaultValue}</code>
                  </td>
                  <td>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Toggle a checkbox → URL updates with non-default flags so the resulting link is
            shareable + reload-safe. Reset to default → key strips from URL.
          </p>
        </details>
      </main>
      <aside className="cx-demo-side">
        <h2>events</h2>
        {events.length > 0 ? (
          <ul className="cx-demo-events">
            {events.map((event) => (
              <li key={event.id} className={`cx-demo-event kind-${event.kind}`}>
                <div className="cx-demo-event-kind">{event.kind}</div>
                <div className="cx-demo-event-detail">{event.detail}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="cx-demo-empty">
            Drag a bar body to move, drag a bar edge to resize, or drag an empty row to select a
            range.
          </div>
        )}
        <footer className="cx-demo-footer">
          <code>{bars.length}</code> bars across <code>{rowsList.length}</code> rows. Day axis from
          local midnight.
          <br />
          Commit events update the bar state in place — drag, then drag again to see the new
          baseline.
        </footer>
      </aside>
    </div>
  );
};
