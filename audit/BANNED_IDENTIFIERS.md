# Banned identifiers

Chronix is an R2 reference rewrite. The following identifiers come from reference codebases (notably k-ui's gantt and its FullCalendar ancestry) and **must not appear in chronix source code, tests, comments, file names, or commits**. Using them creates a documented trail that chronix code is a translation of reference code rather than an independent implementation.

Each banned name has a chronix-native replacement. Use those instead.

## Strong bans (CI-enforced)

These names are distinctive enough that their presence is strong evidence of copying. CI hard-fails when matched.

| Banned | Chronix replacement | Rationale |
| --- | --- | --- |
| `EventInteractionState` | `BarDragTransaction` | k-ui interaction in-flight state |
| `HitDragging` | `PointerCaptureSession` | k-ui hit-test-coupled drag session |
| `DependencyLineAlgorithm` | `LinkRouter` | k-ui dependency line module |
| `DateProfileGenerator` | `AxisRangePlanner` | k-ui/FC date range computation |
| `ResourceSourceInput` | `RowDataSource` | k-ui/FC resource sourcing |
| `ResourceTimelineLayout` | `RowSwimlaneLayout` | k-ui resource swimlane |
| `ContentInjector` | `SlotRenderer` | k-ui content injection |
| `CustomRenderingStore` | `SlotRegistry` | k-ui custom render registry |
| `EventDef` | `BarSpec` | k-ui/FC event definition |
| `EventStore` | `BarTable` | k-ui/FC event collection |
| `ScrollGridImpl` | `VirtualizedPaneLayout` | k-ui scrollgrid implementation |
| `requireInitial` (as identifier) | `requireInitialHit` (own concept, distinct semantics) | k-ui HitDragging field |

## Weak bans (warning only)

CSS class prefixes and other broadly-used tokens. CI warns; the name may be unavoidable in specific contexts.

| Banned | Chronix replacement |
| --- | --- |
| `fc-` (CSS prefix) | `cx-` |
| `gantt-` (CSS prefix in k-ui sources) | `cx-` |
| `k-` (CSS prefix in k-ui) | `cx-` |

## How CI enforces this

`scripts/check-banned-names.mjs` runs:
- In pre-commit (staged files only) via husky
- In CI (`--all` mode, full tree)

The script reads `audit/banned-names.txt` (the source of truth for the strong-ban list). Update both this doc and that file together.

## Process for adding new bans

1. Open a PR adding the name to `audit/banned-names.txt` and this doc.
2. Justify the ban: which reference codebase, which file, why distinctive.
3. Propose the chronix replacement.
4. Merge before any chronix code is written that touches the conflicting area.

## What is NOT banned

Generic terms common to any gantt/timeline implementation: `Task`, `Row`, `Link`, `Tick`, `Bar`, `Range`, `Viewport`, `Scale`, `Snap`, `Layout`. Banning these would force absurd naming.

Algorithm names: `bezier`, `bresenham`, `binary-search`, etc. Algorithms are not copyrightable.
