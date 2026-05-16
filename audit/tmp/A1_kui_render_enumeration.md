# k-ui render-layer enumeration (Agent A1)

## Section H — Internal SVG / DOM render branches

### H.1 Vertical grid separators (cell boundaries and sub-slots)

- `appendVerticalSlotSeparators` at `src/resource-timeline/GanttView.tsx:914-1010`
  - Cell boundary lines: emits `<rect class="gantt-grid-vline">` (solid 1px, x positioned at slot boundary minus 1px) with fill `var(--gantt-border-color, #ddd)`
  - Week-start emphasis: same `<rect>` but with darker fill `var(--gantt-border-color, #bbb)` when `isWeekStart=true`, class name `gantt-grid-vline-week` added
  - Sub-slot dashed dividers: when not a cell boundary and `showDashedNonBoundaries=true`, emits `<line class="gantt-grid-vline gantt-grid-vline-dashed">` with `strokeDasharray="2,2"` and stroke `var(--gantt-border-color, #ddd)`
  - Right edge closing rect: when `includeRightEdge !== false`, final `<rect class="gantt-grid-vline">` at right boundary
  - **Grid lines in body**: `renderGridLines` at line 1062-1108 calls `appendVerticalSlotSeparators` with `keyPrefix='grid'`, `fillTodaySlotHighlight=true`, `showDashedNonBoundaries=true` to render all slot separators
  - **Grid lines in header**: calls `appendVerticalSlotSeparators` per row (lines 544-560) with `fillTodaySlotHighlight=false`, `showDashedNonBoundaries=false` to show only cell boundaries

### H.2 Horizontal grid separators (row bottom lines)

- `renderGridLines` at `src/resource-timeline/GanttView.tsx:1062-1108`, lines 1089-1105
  - Per-row horizontal line: `<line>` element (not rect) with `stroke="var(--gantt-grid-row-rule-color, var(--gantt-border-color, #ddd))"`, `strokeWidth=1`, `vectorEffect="non-scaling-stroke"`, class `gantt-grid-hline`
  - Y position: snapped to device pixel grid via `snapHorizontalGridLineY` (line 1034-1057) to prevent blur at fractional CSS pixels and non-1 DPR scaling
  - Positioned at row bottom: y = `rowYPositions[index] + rowHeights[index]` for each row including last row
  - **Header row dividers**: `renderTimelineHeader` at line 563-576 emits `<rect>` (not `<line>`) for each inter-row boundary in header with fill `var(--gantt-border-color, #ddd)` at y = `(r + 1) * rowH - 1` plus top/bottom frame rects

### H.3 Today highlight background rectangle

- Grid body: `renderGridLines` → `appendVerticalSlotSeparators` with `fillTodaySlotHighlight=true` at line 950-962
  - Emits `<rect class="gantt-today-highlight">` (one rect per today slot) with fill `var(--gantt-today-bg-color, rgba(255, 220, 40, 0.15))`
  - Positioned at slot x/y/width/height spanning the entire segment height
- Header grid: `renderTimelineHeader` at line 525-537
  - Emits `<rect class="gantt-timeline-header-cell-today">` with fill `var(--gantt-today-bg-color, #fcf8e3)` for each cell containing today's date
  - No separate highlight rect rendering in TimelineGrid (that file has stub implementation)

### H.4 Weekend/weekend-like highlights

- Not explicitly rendered in GanttView or TimelineGrid. TimelineGrid stub has `renderWeekendHighlights` method (not called in production). No CSS classes generated for day-of-week in grid rendering.
- Possible via CSS classes on day cells: `gantt-day-saturday`, `gantt-day-sunday` (from `date-rendering.ts:34`) but not separately highlighted with rects

### H.5 Today line / now-indicator (current time vertical line)

- `renderTodayLine` at `src/resource-timeline/GanttView.tsx:1115-1299`
  - **Dashed-dot style**: emits `<div class="gantt-timeline-today-line">` containing SVG with pattern-filled `<rect>` (pattern combining dash + dot segments), border style determined by `todayLineOption.style`
  - **Other styles**: emits `<div class="gantt-timeline-today-line">` with inner `<div>` having `borderLeft: "${lineWidth}px ${borderStyle} ${color}"` (solid/dashed/dotted/double)
  - **Tooltip**: at top in header only, emits `<div class="gantt-timeline-today-line-tooltip">` with inline styles (position, background, color, font)
  - **Z-index**: 1.5 for line, 4 for tooltip
  - **Dimensions**: position absolute at x = result of `dateToCoordTimeline`, full height or `height - 20` if header
  - **Props**: `todayLineOption.color` (default #ff6b6b), `todayLineOption.width` (default 2), `todayLineOption.tooltip` (default '今日'), `todayLineOption.style` (default 'dashed')
  - Rendered in both header and body (isHeader flag controls tooltip and SVG height offset)

### H.6 Mirror elements (drag/resize/progress preview)

- **Event mirror during drag/resize**: at `src/interaction/dnd/ElementMirror.ts:14-200`
  - Clones the dragged SVG element into HTML container with `class="gantt-event-dragging gantt-mirror-container"`
  - Cloned element gets `class="gantt-event-mirror"` appended
  - Container positioned via `style.left` and `style.top` to follow pointer
  - Wrapper SVG element created if source is SVG (line 47-52) to handle coordinate transforms
  - Revert animation: transition applied to position when drag cancelled (line 182-192)
- **Progress drag triangle**: rendered as visual element during progress drag (not separate mirror element in current code; integrated into TimelineEvent)

### H.7 Selection overlay / focus highlight

- **Event selected overlay**: `src/common/StandardEvent.tsx` (line 81-86) renders `<div class="gantt-event-resizer gantt-event-resizer-start/end">` when `isStartResizable` or `isEndResizable`
- **Selection border in SVG events**: `src/timeline/TimelineEvent.tsx:659-673` emits `<rect class="gantt-event-selection-border">` (rounded, no-fill, stroke `rgba(0,0,0,0.3)`, strokeWidth 2) when `isSelected=true`
- **CSS overlay on event selected**: `src/styles/core-css-inline.ts:567-588` renders `:before` and `:after` pseudo-elements on `.gantt-event-selected` with `z-index: 3` and `z-index: 1` respectively
  - **Before**: empty box-shadow + z-index 3
  - **After**: background fill `var(--gantt-event-selected-overlay-color, rgba(0, 0, 0, 0.25))`, positioned top/left/right/bottom -1px to create border effect

### H.8 Popover infrastructure

- **Popover container**: `src/common/Popover.tsx:22-128`
  - Rendered via `createPortal` to `props.parentEl` (off-DOM tree positioning)
  - Root element: `<div class="gantt-popover" id={props.id}>` with theme class + extra classes, `aria-labelledby={state.titleId}`
  - Header: `<div class="gantt-popover-header">` containing title `<span class="gantt-popover-title">` and close icon `<span class="gantt-popover-close">`
  - Body: `<div class="gantt-popover-body">` with `className: theme.getClass('popoverContent')`
  - CSS styling: `z-index: 9999`, `box-shadow: 0 2px 6px rgba(0,0,0,.15)`, positioned absolutely via `applyStyle` (line 122-125)
- **More-link popover**: `src/common/MorePopover.tsx:26-61` wraps a `<DayCellContainer>` inside `<Popover>` for displaying multiple events on a single day/slot
  - Title: formatted date via `dayPopoverFormat`
  - Extra class: `gantt-more-popover`
  - Children: rendered event list (not in this file; passed via props)

### H.9 SVG `<defs>` block contents

- **Timeline header clip paths**: `src/resource-timeline/GanttView.tsx:493-514`
  - `<clipPath id="${clipNs}-c-${rowIndex}-${cellIndex}">` containing `<rect>` for each header cell, clipping text rendering to cell bounds
  - clipNs generated per component instance (line 103)
- **Today line pattern** (dashed-dot only): `src/resource-timeline/GanttView.tsx:1204-1223`
  - `<pattern id="today-line-dashed-dot-${colorHex}">` with pattern-repeating dash + gap + dot + gap segments

### H.10 Background event rendering

- **Background event rect**: `src/timeline/TimelineContent.tsx:195-211` and `src/timeline/TimelineLane.tsx:179-206`
  - `<rect class="gantt-bg-event">` with fill from `eventUi.backgroundColor || 'rgba(200, 200, 200, 0.3)'`
  - Positioned at hcoords (timeline x) and row y, spanning full row height or segment height
  - Rendered in `<g class="gantt-bg-events">` layer (z-index below foreground)
- **Background event with display property**: filtered by `ui.display === 'background'` (line 81 in `event-rendering.ts`)

### H.11 Non-business-hours fill

- **CSS class only**: `src/styles/core-css-inline.ts:484-486` defines `.gantt-non-business { background: var(--gantt-non-business-color, hsla(0, 0%, 84%, .3)); }`
- **Actual rendering**: not found in main render code; requires eventSource to emit events with `display: 'background'` to fill non-business hours

### H.12 Sticky elements (sticky header, sticky sidebar)

- **CSS positioning**: `src/styles/core-css-inline.ts:449-451` defines `.gantt-sticky { position: sticky; }`
- **Applied to**: event titles (line 132 in `src/common/StandardEvent.tsx`), resource list header cells (line 81, 186 in `src/resource-timeline/ResourceList.tsx`), day header cells (line 81 in `src/common/TableDateCell.tsx`)
- **Sticky header scrollgrid section**: `src/styles/core-css-inline.ts:429-441` applies `position: sticky; z-index: 3;` with `background: var(--gantt-page-bg-color)` to `.gantt-scrollgrid-section-sticky` elements
- **Header sticky**: `top: 0` for header sections, `bottom: 0` for footer sections

### H.13 Resize handles (start-edge and end-edge dots or bars)

- **SVG timeline event resize zones**: `src/timeline/TimelineEvent.tsx:437-497`
  - Start edge: transparent `<rect class="gantt-event-resizer gantt-event-resizer-start">` at `x=x, width=edgeResizeZone(8px)`, `cursor: ew-resize`, `fill=transparent`, `pointerEvents=auto`
  - End edge: transparent `<rect class="gantt-event-resizer gantt-event-resizer-end">` at `x=x+width-edgeResizeZone, width=edgeResizeZone`, same cursor/fill/events
  - When selected: hidden transparent zones replaced by visible dot handles (line 500-541)
    - Start dot: `<rect class="gantt-event-resizer gantt-event-resizer-start">` at `x=x+1, width=handleWidth(8px)`, `fill=transparent`, `rx/ry=barCornerRadius`
    - End dot: `<rect class="gantt-event-resizer gantt-event-resizer-end">` at `x=x+width-handleWidth-1`, same dimensions
    - **CSS styling** (line 543-551, 662-675): when selected, border-radius calculated, border-width/color inherited, background white
- **HTML event resize handles**: `src/common/StandardEvent.tsx:81-86` renders `<div class="gantt-event-resizer gantt-event-resizer-start/end">` when resizable

### H.14 Bar progress indicator

- **Progress fill rect**: `src/timeline/TimelineEvent.tsx:397-410`
  - `<rect class="gantt-event-progress">` with same x/y/rx/ry as background but `width=progressWidth` (clamped to event width), `fill=progColor`, `pointerEvents=none`
  - Positioned **on top of** background (rendered after in DOM), z-index integration via render order
  - Progress fill color: from `progress.backgroundColor` or fallback `rgba(0, 0, 0, 0.4)` or callback `progressColor` prop
  - Rendered ONLY if `hasProgress && progressWidth > 0` (line 398)
- **Progress drag triangle handle**: not rendered in TimelineEvent (progress drag is DOM-based in StandardEvent or managed separately via interaction layer)
- **HTML progress bar**: `src/common/StandardEvent.tsx:113-127`
  - `<div class="gantt-event-progress-bar">` with width `${progress.value}%`, positioned `absolute top=0 left=0 zIndex=0`
  - Background color from `progress.backgroundColor` or calculated from event background

### H.15 Bar text / label render path

- **SVG timeline event text**: `src/timeline/TimelineEvent.tsx:543-656`
  - `<text class="gantt-event-text">` element, positioned at center of event bar
  - **Truncation logic** (lines 615-635): text width calculated based on available space considering triangle indicators, truncated to fit via `truncateText` function (line 717-730)
  - **Display conditions**: only rendered if `showText=true && finalWidth > 30`, and if `availableWidth >= 10`
  - **Text content**:
    - If progress has `textFormat` and `showText !== false`: format applied with `{value}` and `{title}` substitutions (line 619-633)
    - Otherwise: plain `title` text
  - **Styling**: `x=titleStartX, y=y+height/2, fill=textColor, fontSize, fontWeight, textAnchor='start', dominantBaseline='middle'`
  - **Continuation indicators**: triangle indicators positioned around text (lines 313-348), text positioned to avoid triangles
- **HTML event text**: `src/common/StandardEvent.tsx:112-159`
  - `<div class="gantt-event-title gantt-sticky">` containing title or formatted progress text
  - `<div class="gantt-event-time">` above title if `timeText` is present (line 130)
  - Background progress bar rendered BEFORE text (z-index ordering)

### H.16 Loading / async-fetch UI

- No explicit loading spinners or skeleton screens found in render code
- Async state managed at reducer/interaction level, not rendered via dedicated UI elements

### H.17 Event continuation indicators (continuation triangles)

- **Left triangle** (when event continues to left): `src/timeline/TimelineEvent.tsx:412-420`
  - `<polygon class="gantt-event-continuation-indicator gantt-event-continuation-left">` with `fill="#000" opacity=0.8 pointerEvents=none`
  - Points calculation (line 313-328): when `isClippedStart=true`, triangle apex at container left boundary with base extending right; otherwise at event left edge
  - Sized via `triangleSize=6`, margin `triangleMargin=1`
- **Right triangle** (when event continues to right): `src/timeline/TimelineEvent.tsx:423-431`
  - `<polygon class="gantt-event-continuation-indicator gantt-event-continuation-right">` same styling
  - Points calculation (line 330-348): when `isClippedEnd=true`, triangle apex at container right boundary; otherwise at event right edge
  - **Position relative to event body**: rendered AFTER background rect so visible on top (render order = z-ordering in SVG)

---

## Section I — Per-view render variations

### I.1 Day view

- **Header rows**: 1 row (day header with date and day-of-week)
- **Slot granularity**: from `tDateProfile.slotDuration`, typically hourly or 30-minute intervals
- **Header cell rendering**: `src/common/TableDateCell.tsx:29-89` with date formatted via `dayHeaderFormat`, includes nav-link if `colCnt > 1`
- **Grid cell density**: high (many slots per view)
- **Example slot labels**: HH:MM format

### I.2 Week view

- **Header rows**: 2 rows (week row with week number + date range, then day row with individual days)
- **Slot granularity**: typically hourly or daily (configurable)
- **Cell colspan**: day cells span multiple time slots (e.g. 24 slots for full-day hour granularity)
- **Week start emphasis**: grid lines darker at Monday/Sunday boundaries (CSS class `gantt-grid-vline-week`)
- **Header cell rendering**: colspan applied per day, date label centered in multi-slot cell

### I.3 Month view

- **Header rows**: 2-3 rows (month header, then week row, then day-of-week row)
- **Slot granularity**: daily (one slot per day)
- **Grid spacing**: reduced vertical lines (daily boundaries)
- **Non-current-month day styling**: CSS class `gantt-day-other` applied (from `date-rendering.ts:52`)
- **Week number column**: separate column via `WeekNumberContainer` (if enabled)

### I.4 Multi-week / custom range views

- **Header rows**: depends on `tDateProfile.cellRows.length`
- **Slot count**: calculated from `tDateProfile.slotDates.length`
- **Grid rendering**: same `appendVerticalSlotSeparators` logic, adapts to slot count

### I.5 Per-view CSS classes for cells

- **Day metadata classes**: from `getDayClassNames` (`date-rendering.ts:33-58`)
  - `gantt-day` (all cells)
  - `gantt-day-${DAY_ID}` (e.g. `gantt-day-mon`, `gantt-day-sun`)
  - `gantt-day-today` (if today)
  - `gantt-day-disabled` (outside active range)
  - `gantt-day-past` (before today)
  - `gantt-day-future` (after today)
  - `gantt-day-other` (outside current month/period)
  - Theme class from `theme.getClass('today')`
- **Slot classes**: from `getSlotClassNames` (`date-rendering.ts:60-81`)
  - `gantt-slot`, `gantt-slot-${DAY_ID}`, `gantt-slot-today`, `gantt-slot-disabled`, `gantt-slot-past`, `gantt-slot-future`

### I.6 Header outer band rect (background for header text area)

- Not explicitly rendered in k-ui; header uses CSS borders and fills via `.gantt-scrollgrid-section-header` styling

---

## Section L — Per-bar render details

### L.1 Bar geometry

- **Shape**: SVG `<rect>` with rounded corners (not custom path)
- **Positioning**: x/y from placement calculation, width from `hcoords.end - hcoords.start`, height from `eventHeight` prop
- **Rounding**: `rx` and `ry` set to `barCornerRadius` prop (default 3px)
- **Clipping on container boundary**: handled via `isClippedStart/isClippedEnd` flags (set in `TimelineEvent.tsx:292-299`), not by CSS clip-path on individual events

### L.2 Border / fill / opacity defaults

- **Background fill**: `backgroundColor || eventUi.backgroundColor || '#3788d8'` (from `TimelineEvent.tsx:234-237`)
- **Border**: `stroke={borderColor}`, `strokeWidth={borderColor ? 1 : 0}` (line 385-386)
- **Opacity**: default 1, reduced to 0.8 during drag/resize (line 389)
- **Selected styling**: darker background (`adjustColor(bgColor, -20)`, line 236), box-shadow (line 564)

### L.3 isStart / isEnd / continuesFrom / continuesTo flags and their render effects

- **isStart flag**: controls left triangle indicator render (line 321-328 in `TimelineEvent.tsx`)
  - When `!isStart=true` (event does not start in view), left continuation triangle rendered
  - Affects text positioning to avoid triangle overlap (line 577-587)
- **isEnd flag**: controls right triangle indicator render (line 341-348)
  - When `!isEnd=true` (event does not end in view), right continuation triangle rendered
  - Affects text positioning (line 590-600)
- **isClippedStart/isClippedEnd**: separate from isStart/isEnd, indicates container boundary overflow
  - Determines whether triangle is at container edge (containerWidth-relative) or event edge (x-relative)
  - Does NOT suppress rendering of the bar itself

### L.4 Selected styling

- **CSS box-shadow**: `box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2)` (line 564)
- **Overlay rect**: `<rect class="gantt-event-selection-border">` with `fill=none stroke=rgba(0,0,0,0.3) strokeWidth=2` (line 659-673)
- **Overlay fill**: `:after` pseudo-element with `background: var(--gantt-event-selected-overlay-color, rgba(0, 0, 0, 0.25))`
- **Background color**: changed to `selectedBackgroundColor` (line 237)

### L.5 Tab-index, ARIA, role, aria-selected

- **SVG event group**: `<g tabIndex={0} role=button aria-selected={isSelected ? 'true' : 'false'}>` (not explicit in code; would be at top-level group)
- **HTML event anchor**: role implicit from `<a>` tag in `StandardEvent.tsx`
- **Data attributes**: `data-event-id={eventDef.publicId}` and `data-instance-id={seg.eventRange.instance.instanceId}` (line 354-355)

### L.6 Hover state

- **CSS class toggle**: `data-event-hover` attribute set to 'true' on mouseenter, 'false' on mouseleave (line 358-371)
- **No explicit :hover pseudo-element CSS** for hover styling in `core-css-inline.ts` (would be added via theme or custom CSS)
- **Cursor change**: on mousemove over background, cursor set to 'move' (line 116-119)

### L.7 Mirror geometry during drag/resize

- **Cloned element**: positioned via `ElementMirror` at `left = originalX + deltaX`, `top = originalY + deltaY` (line 112-114)
- **No width/height change**: mirror maintains original dimensions
- **Opacity**: no change from original (or reduced from event's dragging opacity if using element as-is)
- **Z-index**: placed in `.gantt-mirror-events-group` with `z-index: (3+)` above regular events

### L.8 Progress fill position and drag handle

- **Progress fill rect**: immediately after background rect, x/y same as background, width = `progressWidth`, fill with progress color
- **Progress fill Z-index**: on top of background (rendered later in render call, no explicit z-index in SVG group)
- **Drag triangle for progress**: not separately rendered in `TimelineEvent`; could be managed via `eventProgress` interaction state in parent
- **Resize edge collision with progress**: special handling at line 452-495 to avoid overlap when progress is nearly 100% wide

### L.9 Resize-edge render

- **Start edge zone**: `<rect class="gantt-event-resizer gantt-event-resizer-start">` at `x=x, y=y, width=edgeResizeZone(8px), height=height`
- **End edge zone**: `<rect class="gantt-event-resizer gantt-event-resizer-end">` at `x=x+width-edgeResizeZone, y=y, width=edgeResizeZone, height=height`
- **When selected**: replaced by larger visible dot handles (width=`handleWidth(8px)`) with border and white background
- **Cursor**: `ew-resize` (east-west)
- **Hit testing**: via `checkEdgeResizeZone` method (line 80-103)

### L.10 Per-event class names from callbacks

- **From `getEventClassNames`** (`component/event-rendering.ts`): generates classes based on event state
  - Standard classes: `gantt-event`, `gantt-h-event`, `gantt-event-draggable`, `gantt-event-dragging`, `gantt-event-selected`, etc.
  - **Custom classes from callbacks**: `classNameGenerator` option (line 120-124 in `EventContainer.tsx`)
  - **UI classes**: `seg.eventRange.ui.classNames` array applied (line 122)

### L.11 Per-event style overrides from callbacks

- **Background color callback**: `options.eventStyleCallbacks?.eventBackgroundColor(renderProps)` (line 68-70 in `EventContainer.tsx`)
- **Border color callback**: `options.eventStyleCallbacks?.eventBorderColor(renderProps)` (line 72-75)
- **Text color callback**: `options.eventStyleCallbacks?.eventTextColor(renderProps)` (line 89-91)
- **Font size callback**: `options.eventStyleCallbacks?.eventFontSize(renderProps)` (line 94-96)
- **Font weight callback**: `options.eventStyleCallbacks?.eventFontWeight(renderProps)` (line 97-99)
- **Applied to**: `renderProps` object passed to renderers, values merged into `mergedElStyle` (line 104-113)

---

## Section M — Per-link / dependency-line render details

### M.1 Link line render (path generation, smoothing, routing)

- **Algorithm class**: `DependencyLineAlgorithm` (`src/timeline/DependencyLineAlgorithm.ts:105-??`)
  - **Line types**: `square` (orthogonal) or `smooth` (cubic bezier)
  - **Point generation**: `setSquarePoints` method (line 166-226) generates waypoints for square routing
  - **Self-adaptive routing**: algorithm internally checks position relationships (same row, target left/right, target up/down) and chooses path accordingly
  - **Square routing steps**: right → down/up → left → approach target, or straight horizontal if same row and target right
- **Dependency collection**: `TimelineDependencies.collectDependencies` (`src/timeline/TimelineDependencies.tsx:97-140`)
  - Reads from event `extendedProps.dependencies` (array) or `dependsOn` (string) fields
  - Builds connections between fromPlacement and toPlacement
- **SVG rendering**: lines rendered as `<path>` elements (not shown in provided code, but referenced in `ResourceTimelineDependencies`)

### M.2 Marker variants (arrow, custom shapes, per-direction)

- **Marker types**: `MarkerType = 'arrow' | 'diamond' | 'diamond-hollow' | 'circle' | 'circle-hollow' | 'pointer' | 'plus' | 'none' | string` (line 20-29 in `DependencyLineAlgorithm.ts`)
- **Custom marker definition**: `CustomMarkerDef` interface (line 41-50) with `id`, `render()` function accepting `markerId`, `color`, `direction` ('horizontal', 'vertical-up', 'vertical-down')
- **Default**: 'arrow' marker (line 29 in `GanttView.tsx:816`)
- **SVG marker registration**: custom markers defined in `<defs>` block (would be in SVG rendering layer)

### M.3 Mirror during drag

- **Mirror placements**: `TimelineDependencies` accepts `mirrorPlacements` prop (line 33), updates dependency lines during drag
- **Cache for stability**: `mirrorPositionCache` map (line 63) prevents visual jitter when mirror loses match temporarily
- **Forced visibility during drag**: dependency lines continue to render to/from dragged event's mirror position

### M.4 Color callbacks

- **useLineEventColor**: boolean option (line 28 in `TimelineDependencies`)
  - When true, line color taken from source event's color instead of `dependencyLineColor`
- **dependencyLineColor**: default line color (prop passed at line 812 in `GanttView.tsx`)
- **onLine callback**: single or array of callbacks (line 26, line 95 in `DependencyLineAlgorithm.ts`)
  - Receives `DependencyLine` object, can modify `line.type`, `line.markerType`, `line.extraVerticalOffset`, etc.
  - Executed for each line via `executeOnLineCallbacks` (line 143-151)

### M.5 Per-link style overrides

- **Via onLine callback**: `line.markerType`, `line.extraVerticalOffset` can be set per line (line 73-76 in `DependencyLineAlgorithm.ts`)
- **No per-link CSS classes** found (links are SVG, not HTML elements with class lists)

### M.6 Hover / focus states

- No explicit hover state handling for dependency lines in provided code
- Potential via custom CSS targeting `<line>` or `<path>` elements with `.gantt-dependency-line:hover` (not defined in `core-css-inline.ts`)

---

## Section N — Per-cell + per-row + per-header render details

### N.1 Day-cell CSS classes

- **Base class**: `gantt-day` (always)
- **Day-of-week**: `gantt-day-${DAY_IDS[dow]}` where `DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']` (from `datelib/marker.ts`)
- **Today**: `gantt-day-today` + theme class `theme.getClass('today')`
- **Disabled**: `gantt-day-disabled` (when outside active range)
- **Past/Future**: `gantt-day-past`, `gantt-day-future`
- **Other month**: `gantt-day-other`
- **Applied to**: table cells in `TableDateCell.tsx:36` via `getDayClassNames` function

### N.2 Week-number column

- **Component**: `WeekNumberContainer` (`src/common/WeekNumberContainer.tsx:23-53`)
  - Renders via `ContentContainer` with `generatorName="weekNumberContent"`
  - Content generated via `options.weekNumberContent` callback or default `renderInner` (which just returns text)
  - Computed value: `dateEnv.computeWeekNumber(date)`
  - Format: `options.weekNumberFormat` or fallback format
  - Classes applied: `classNameGenerator` option applied to container
- **Markup**: `<th>` or custom tag via `elTag` prop

### N.3 Header cell render variants

- **TableDateCell** (`src/common/TableDateCell.tsx:29-89`): renders as `<th>` with role='columnheader'
  - Text content: formatted date via `dayHeaderFormat`
  - Nav-link: wraps text in `<a>` element if `colCnt > 1` (not single day view)
  - Classes: `gantt-col-header-cell` + day metadata classes
  - Sticky: class applied if `isSticky=true`
- **Timeline header SVG** (`src/resource-timeline/GanttView.tsx:578-615`): renders as `<text>` elements
  - Clipped to cell bounds via clipPath
  - Centered, with bold font for first row
  - Tooltip on `<title>` element for truncated text

### N.4 Row class names from callbacks

- **Resource row**: `src/resource-timeline/ResourceList.tsx:206-??`
  - Classes: `gantt-resource-row`, `gantt-resource-item-row` or `gantt-resource-group-row`
  - Plus callback-generated classes via `classNameGenerator` option (not shown but referenced in ContentContainer)
- **Data attributes**: `data-row-index`, `data-resource-id` (line 223-224)

### N.5 Cell-content callbacks

- **dayCellContent**: `options.dayHeaderContent` callback (line 69 in `TableDateCell.tsx`), receives `DayHeaderContentArg` with date/view/text/metadata
- **dayCellClassNames**: `options.dayHeaderClassNames` callback (line 71), returns class array
- **Resource cell content**: `options.resourceLabelContent` or `col.cellContent` callback (line 49 in `ResourceList.tsx`)
- **Week number content**: `options.weekNumberContent` callback (line 42 in `WeekNumberContainer.tsx`)

### N.6 Resource group row (rowspan merge, group cell class)

- **Rowspan support**: `ResourceList.tsx` line 230-240 handles `rowSpans` array from node
  - If `rowSpan === 0`, cell is hidden (rendered by previous row via rowspan)
  - If `rowSpan > 1`, cell rendered with `rowSpan` attribute
  - Group cells identified when `rowSpan > 1` (line 243)
- **Group cell rendering**: `renderGroupRow` (line 132-203)
  - Markup: `<th class="gantt-resource-group-cell">` with `colSpan=colSpecs.length`, `scope='colgroup'`
  - Background: `background: var(--gantt-neutral-bg-color, #ffffff)` (line 150)
  - Click handler: toggles group expansion (line 182)

### N.7 Sidebar/resource-area cell render

- **Markup**: `<td>` in table body (line 226 in `ResourceList.tsx`)
- **Classes**: `gantt-resource-cell`, `gantt-resource-group-cell`, or implicit from ContentContainer
- **Content**: `col.cellContent(resource)` callback or default (name/title)
- **Sticky column**: when first column, marked with `.gantt-scrollgrid-sync-inner` (line 186)

### N.8 Popover trigger (more-link)

- **Component**: `MorePopover` (`src/common/MorePopover.tsx:26-61`)
  - Props: `startDate`, `endDate`, `parentEl`, `alignmentEl`, `extraDateSpan`
  - Triggered when more events exist than can fit in day cell
  - Alignment: `alignGridTop` prop positions popover at grid top instead of cell top
- **Markup**: wraps `DayCellContainer` inside `Popover`, children passed as event list
- **Title**: formatted via `options.dayPopoverFormat` (line 33)

---

## Section O — CSS surface

(CSS variables, selectors, transitions — full enumeration in agent output. Key findings:)

### O.1 CSS Variables (--gantt-\*)

- Colors: `--gantt-page-bg-color`, `--gantt-neutral-bg-color`, `--gantt-neutral-text-color`, `--gantt-border-color`, `--gantt-grid-row-rule-color`, button colors (text/bg/border + hover + active variants), `--gantt-event-bg-color`, `--gantt-event-border-color`, `--gantt-event-text-color`, `--gantt-event-selected-overlay-color`, `--gantt-more-link-bg-color`, `--gantt-more-link-text-color`, `--gantt-non-business-color`, `--gantt-bg-event-color`, `--gantt-bg-event-opacity`, `--gantt-highlight-color`, `--gantt-today-bg-color`, `--gantt-now-indicator-color`
- Dimensions: `--gantt-small-font-size`, `--gantt-event-resizer-thickness`, `--gantt-event-resizer-dot-total-width`, `--gantt-event-resizer-dot-border-width`

### O.2 Animation / transitions

- **No `@keyframes`** declared
- **Transition on popover repositioning**: implicit
- **Transition on mirror revert**: `mirrorEl.style.transition = 'top ' + duration + 'ms,' + 'left ' + duration + 'ms'` (ElementMirror.doRevertAnimation:182)
- **No CSS animations** for loading/blinking/spinning

### O.3 No media queries

- No `@media print` rules; print via `forPrint` prop branching in render

---

## Additional notes / ambiguities

**⚠️ ambiguous**: Grid line rendering in `TimelineGrid.tsx` is a stub implementation (uses synthetic `<line>` elements for testing, not integrated with real grid in production). Real grid comes from `GanttView.renderGridLines`.

**⚠️ ambiguous**: Non-business-hours rendering (`gantt-non-business` class) is defined in CSS but no code generates events with `display='background'` to fill those hours in the enumerated files. This feature may be external (user-provided event source).

**⚠️ ambiguous**: Weekend highlighting has CSS classes defined in `date-rendering.ts` but no SVG rects rendered for weekend cells in the body. Highlighting exists only for day-of-week class styling (background color would come from external CSS, not inline).

**Silent-gap confirmation**: Grid lines real implementation is in `GanttView.renderGridLines` with vertical + horizontal lines + today highlights. Chronix has nothing equivalent.
