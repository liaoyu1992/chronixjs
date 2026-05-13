# R2 mapping (chronix ← reference)

Audit trail for the rewrite. Each chronix name and the reference-side
analog it replaces. The reference names listed here are **banned** in
chronix code (see [`banned-names.txt`](./banned-names.txt) and
[`BANNED_IDENTIFIERS.md`](./BANNED_IDENTIFIERS.md)) — this file is
exempt from the scanner because documenting the mapping requires
mentioning them.

The chronix-side names themselves are defined in
[`../packages/gantt/MODULE_TAXONOMY.md`](../packages/gantt/MODULE_TAXONOMY.md).

| chronix name                  | reference analog                                                            | notes                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `BarSpec`                     | `EventDef`                                                                  | event definition                                                                             |
| `BarTable`                    | `EventStore`                                                                | event collection                                                                             |
| `RowDataSource`               | `ResourceSourceInput`                                                       | resource sourcing                                                                            |
| `RowSwimlaneLayout`           | `ResourceTimelineLayout`                                                    | resource Y-positioning                                                                       |
| `AxisRangePlanner`            | `DateProfileGenerator`                                                      | date range + tick computation                                                                |
| `LinkRouter`                  | `DependencyLineAlgorithm`                                                   | dependency path computation                                                                  |
| `VirtualizedPaneLayout`       | `ScrollGridImpl`                                                            | scroll-region geometry                                                                       |
| `SlotRenderer`                | `ContentInjector`                                                           | template invocation                                                                          |
| `SlotRegistry`                | `CustomRenderingStore`                                                      | template registry                                                                            |
| `PointerCaptureSession`       | `HitDragging`                                                               | pointer-capture lifecycle                                                                    |
| `BarDragTransaction` (subset) | `EventInteractionState`                                                     | in-flight drag state                                                                         |
| `BarResizeTransaction`        | `EventInteractionState` (resize mode)                                       | distinct transaction, not a mode                                                             |
| `ProgressHandleTransaction`   | `EventInteractionState` (progress mode)                                     | distinct transaction; reference excludes triangle from event-drag (EventDragging.ts:125-126) |
| `PointerOverlayGroup`         | `<g class="gantt-progress-triangles" pointerEvents:auto>` (CSS-level idiom) | promoted to IR primitive                                                                     |
| `requireInitialHit`           | `requireInitial` (boolean on `HitDragging`)                                 | semantic name + first-class config                                                           |

## How to extend

When chronix code introduces a new module that has a reference-side
analog:

1. Add the chronix name + responsibility to
   [`../packages/gantt/MODULE_TAXONOMY.md`](../packages/gantt/MODULE_TAXONOMY.md)
2. Add the row here under "chronix name | reference analog | notes"
3. If the reference name is distinctive enough to be evidence of copying,
   add it to [`banned-names.txt`](./banned-names.txt) and
   [`BANNED_IDENTIFIERS.md`](./BANNED_IDENTIFIERS.md)
