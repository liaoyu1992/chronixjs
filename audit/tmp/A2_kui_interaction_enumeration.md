# k-ui interaction+animation enumeration (Agent A2)

(Full agent output archived. Key sections summarized below; cite agent transcript for verbatim file:line.)

## Section J — Pointer / mouse / touch interactions (32 items)

### J.1-J.5 Pointer-down behaviors per element type

- **Event bar drag init**: `EventDragging.handlePointerDown` (`src/interaction/interactions/EventDragging.ts:97-133`). Gate: `.gantt-event-draggable` class; NOT on `.gantt-event-resizer`, `.gantt-event-progress-handle`, `.gantt-event-progress-drag-triangle`. minDistance=5px mouse / 0 touch. Touch delay = eventLongPressDelay (fallback longPressDelay).
- **Resize handle**: `EventResizing.handlePointerDown` (`EventResizing.ts:85-110`). Gate: `.gantt-event-resizer`. Touch requires already-selected event.
- **Date background**: `DateSelecting.handlePointerDown` (`DateSelecting.ts:49-60`). Gate: `selectable===true`. selectMinDistance.
- **Click detection**: `DateClicking.handlePointerDown` (`DateClicking.ts:45-60`). Records initialTarget. Gate: NOT on `.gantt-event-progress-drag-triangle`.
- **Progress drag triangle**: `EventProgressing.handlePointerDown` (`EventProgressing.ts:90-140`). Gate: `.gantt-event-progress-drag-triangle` selector. Records initial value from `extendedProps.progress.value`.

### J.6 Drag distance gate (5px Pythagorean)

- `FeaturefulElementDragging.onPointerMove` (`dnd/FeaturefulElementDragging.ts:101-125`).
- `distanceSq = deltaX*deltaX + deltaY*deltaY; if (distanceSq >= minDistance*minDistance) handleDistanceSurpassed(ev)`.
- Default mouse 5px, touch 0px.

### J.7 Long-press delays

- `eventLongPressDelay` (fallback `longPressDelay = 1000ms`) — `EventDragging.ts:687-693`.
- `selectLongPressDelay` — `DateSelecting.ts:116-124`.
- External draggable `longPressDelay` — `ExternalDraggable.ts:44-53`.
- Touch-only (mouse skips delay).

### J.8-J.9 Mirror element lifecycle

- **Create**: `ElementMirror.start` (`ElementMirror.ts:33-55`). Captures bounding rect; extracts SVG coords; recreates element each drag to avoid accumulated errors.
- **Move**: `ElementMirror.handleMove` (`ElementMirror.ts:112-118`). deltaX/Y = pageX/Y - scroll - origScreenX/Y. Calls `updateElPosition`.
- **Visibility**: `setIsVisible` toggles `display: '' | none`.
- **Variants**: HTML elements use `createHtmlMirror` (`position: fixed`); SVG elements use `createSvgMirror` (`position: absolute` clipped by parent overflow).

### J.10 Drag-to-create event (date selection drag)

- `DateSelecting.handleHitUpdate` (`DateSelecting.ts:66-104`).
- Joins initial-hit + current-hit into DateSpan via `joinHitsIntoSelection`.
- Dispatches `SELECT_DATES` action.
- Validation: `isDateSelectionValid` checks `dateProfile.validRange`, `selectConstraint`, `selectOverlap`, `selectAllow`.

### J.11-J.13 Hit-test pathways

- `HitDragging.queryHitForOffset` (`HitDragging.ts:162-223`): iterates `InteractionSettingsStore`, checks clipping parents, calls `component.queryHit`, validates active range, performs `elementFromPoint` obscuring check, returns highest-layer hit.
- Edge resize: `.gantt-event-resizer` selector + `isHitComboAllowed` callback.
- Progress triangle: `.gantt-event-progress-drag-triangle` selector + `data-instance-id` instance lookup.

### J.14-J.19 Commit / emission paths

- **Event drag commit**: `eventDragStop` always → if hit changed: `eventDrop` → `eventChange` (same scheduler) OR `eventLeave` → `eventRemove` → `eventAdd` → `eventReceive` (cross-scheduler) OR `_noEventDrop`.
- **Resize commit**: `eventResizeStop` always → `eventResize` → `eventChange` (mutation) OR `_noEventResize`.
- **Progress commit**: `eventProgressStop` always → `eventProgress` → `eventChange` (mutation) OR `_noEventProgress`. Stops propagation/prevents default to suppress click.
- **Date select commit**: triggers `dateClick` via `triggerDateSelect` on pointerup with dragSelection.
- **Click detection**: requires `!wasTouchScroll`, `isHitsEqual(initial, final)`, NOT starting/ending on progress triangle.

### J.20-J.24 Pointer-cancel + touch

- **Touch cancel**: `PointerDragging.handleTouchEnd` (lines 211-227) handles `touchcancel` same as `touchend`.
- **Window touch scroll cancel**: `cancelTouchScroll` sets flag → window-level `touchmove` calls `preventDefault`.
- **Pointer capture**: NOT used; mouse handlers attach to `document`, touch handlers to target element.
- **Mouse/Touch normalization**: `createEventFromMouse` / `createEventFromTouch` populate `{origEvent, isTouch, subjectEl, pageX/Y, deltaX/Y}`. Touch prefers `touches[0]`.
- **Touch-scroll vs drag**: `touchScrollAllowed` property; `false` for event drag + date select.

### J.25-J.27 External HTML5 drag-in

- `ExternalElementDragging.canDropElOnScheduler` (`interactions-external/ExternalElementDragging.ts:195-207`).
- `dropAccept` callback (function or selector string).
- Drag-start metadata: extracted from `suppliedDragMeta` or `data-event` attribute (parsed as JSON).
- Drag-out (eventLeave): implicit; drag state cleared via `displayDrag(null, ...)`.

### J.28 Hover detection

- `EventHovering` class (`interactions/EventHovering.ts:18-74`).
- `listenToHoverBySelector` (`util/dom-event.ts:39-62`).
- Events: `mouseover` → `handleSegEnter` → `eventMouseEnter` emit; `mouseleave` → `handleSegLeave` → `eventMouseLeave` emit.

### J.29 Keyboard

- `createAriaKeyboardAttrs` (`util/dom-event.ts:99-109`): Enter/Space trigger callback; Space also `preventDefault`.
- Applied to elements with `tabIndex: 0`.
- NO keyboard drag / resize / delete handlers.

### J.30 Modifier keys

- ONLY `isPrimaryMouseButton`: `ev.button === 0 && !ev.ctrlKey` excludes right-click (`PointerDragging.ts:349`).
- No Ctrl/Cmd/Shift checks during interactions.

### J.31 Multi-touch

- Single-touch only (`touches[0]`).

## Section J.5 — Selection-rect mechanics (7 items)

- Selection follows cursor (no snap during drag).
- Hit updates on every `dragmove`.
- Cross-row selection allowed by default; component can restrict via `isHitComboAllowed`.
- Commit on pointerup; unselect on movement away from all hits.
- **UnselectAuto**: `UnselectAuto.onDocumentPointerUp` triggers `ganttSchedulerApi.unselect(pev)` when click outside (`options.unselectAuto === true`, NOT on `unselectCancel` selector, NOT touch-scroll, NOT recent pointer-select).
- No dedicated `selectMirror` element (only state-driven render).
- `selectMinDistance` Pythagorean gate applied (default undocumented).

## Section J.6 — Validation pathway (7 items)

- **eventAllow**: at commit only. `isInteractionPropsValid` iterates `subjectConfig.allows[]`, calls each `subjectAllow(dateSpan, eventApi)`. Returns false if any returns false.
- **eventConstraint**: during drag + at commit. Supports `'businessHours'`, string groupId, event-object, false.
- **eventOverlap**: during drag + at commit. Checks `overlap: false` on subject + others; calls `eventOverlapFunc(otherEvent, movingEvent)` if function.
- **selectAllow**: at commit only.
- **Order during drag**: `isInteractionValid` → `isNewPropsValid` → `isPropsValid` → `isInteractionPropsValid` (constraint → overlap → allow).
- **Revert on reject**: `setMirrorNeedsRevert(true)` + `setMirrorIsVisible(false)` + `disableCursor()` (CSS class on body changes cursor to "not-allowed").
- **No color-change feedback** on mirror.

## Section J.7 — Resize semantics (4 items)

- **Cross-over policy**: `computeMutation` (`EventResizing.ts:302-318`) returns null if start resize would make new-start >= end, or end resize would make new-end <= start. k-ui REJECTS cross-over.
- **Edge detection**: CSS class `.gantt-event-resizer` + element size positioning.
- **No hard min duration**: validation only checks end > start; constraint-based via `eventConstraint`.
- **No snap-to-tick** in interaction layer; component's `queryHit` would do it.

## Section K — Animations / timers (40+ items)

### K.1-K.3 NowTimer (live "now" updates)

- `NowTimer.ts` cadence (lines 53-88): if `nowIndicatorSnap === true`, waits to next unit boundary; if `'auto'`, enabled for large units; if `false`, 5-minute precision.
- Max wait capped at 86400000ms.
- **Visibility pause**: `visibilitychange` document event → if `!document.hidden`, calls `handleRefresh` to reset timer.
- **Refresh**: recomputes `nowDate` + `waitMs`; dispatches `setState` if changed; restarts setTimeout.

### K.4-K.6 Drag-revert + mirror animations

- **Drag revert**: `dragRevertDuration` (default 500ms). `ElementMirror.doRevertAnimation` sets CSS `transition: top {ms}ms, left {ms}ms`; applies new position; waits `whenTransitionDone`.
- Skipped if hit didn't change (immediate reset).
- **Mirror tracking**: Start captures `origScreenX/Y` + rect. Move recomputes deltaX/Y. `updateElPosition` applies CSS left/top.
- **Opacity**: not explicitly set (relies on `.gantt-event-dragging` CSS).
- **z-index**: `ElementMirror.zIndex` property (default 1).

### K.7 Continuation triangle animation

- `ElementMirror.updateTriangleIndicators` (lines 233-401).
- Called on every mirror move + visibility change.
- SVG polygons created dynamically for left/right clipping indicators.
- Position calculated based on container boundary relative to mirror.
- Opacity: 0.8. Display toggled via `style.display`.
- Title text position adjusted to stay visible.

### K.8-K.16 Other animations/timers

- **Resize transition**: NONE (re-render only).
- **Selection-rect**: NO animation (state-driven render).
- **Hover/focus transitions**: NONE in interaction layer (theme-defined).
- **Popover open/close**: NONE in interaction layer.
- **Loading spinner/shimmer**: NOT implemented.
- **Window resize**: `handleWindowResize` (default true) + `windowResizeDelay` (default 100ms). Component-lifecycle handled.
- **Rerender delay**: `rerenderDelay` option (debounce reducer/render).
- **Print mode**: `_beforeprint` / `_afterprint` listeners in `GanttSchedulerRoot.tsx:54-95`. Handlers apply/remove print CSS.
- **Online/offline**: option mentioned but no listeners.

## Section K.5 — Scroll synchronization (10 items)

### ScrollResponder

- `fireInitialScroll` (`ScrollResponder.ts:37-41`). Called in constructor + on date update if `scrollTimeReset===true`.
- Passes `{ time: scrollTime }` to handler.
- Fires only if handler returns true.
- **Queuing**: `handleScrollRequest` merges new request with existing queued request. `drain` calls handler.

### AutoScroller

- Edge threshold default 50px (`options.edgeThreshold`).
- Max velocity default 300px/sec (`options.maxVelocity`).
- Velocity curve: `((invDistance / edgeThreshold)^2) * maxVelocity`.
- Scroll query: `window` + `.gantt-scroller` elements.
- **Movement tracking flags**: `everMovedUp/Down/Left/Right` prevent initial near-edge from auto-scrolling (line 64-71).
- **Animation loop**: `requestAnimationFrame` (line 99). Stops when no edge in threshold.

## Section K.6 — Performance optimizations (5 items)

- **OffsetTracker caching**: cached original element rect; tracks parent scroll containers via `ElementScrollGeomCache`. `computeLeft/Top` add/subtract scroll deltas from cached values.
- **ElementScrollGeomCache**: maintains rect + scroll position; passive `doesListening` param.
- **HitDragging cache**: `prepareHits` creates `OffsetTracker` per droppable; `releaseHits` destroys after drag.
- **Element mirror coordinate extraction**: `extractSvgCoordinates` caches original SVG position; screen-to-SVG conversion uses fresh bounding rects.
- **Progress drag throttling**: only updates if `|newProgress - lastUpdateProgress| >= 0.5%`; smaller change uses `setTimeout(..., 16ms)` to defer.

## Section L — Interaction state management (4 items)

- **EventDragging tracked state**: subjectEl, subjectSeg, isDragging, eventRange, relevantEvents, receivingContext, validMutation, mutatedRelevantEvents, lastValidHit.
- **isHitsEqual**: checks both null OR both exist + same dateSpan via `isDateSpansEqual`.
- **Mutation validation gates** (validation.ts:81-256): constraint → overlap → allow.
- **Commit dispatch**: `MERGE_EVENTS` action with mutated event store; happens AFTER `eventDragStop` emitted; cross-scheduler removes from source + adds to dest.

## TOTAL: 150+ enumerated items.
