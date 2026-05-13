# YYYY-MM-DD

## Reference files read

<!-- Path:line ranges, what module, what specifically you looked at. Example:
- d:/work/k-ui/packages/gantt/src/interaction/dnd/HitDragging.ts:34-180
  → drag state machine, hit-test gating
-->

-

## Mechanisms understood

<!-- One sentence per mechanism. The "why" behind the implementation, not the "what".
Example:
- requireInitial=false is needed when the draggable region is in a different SVG layer
  than the timeline body's queryHit zone, otherwise pointerdown is rejected.
-->

-

## Chronix work derived

<!-- What you wrote today and which mechanism it expresses. Example:
- packages/gantt/src/interaction/pointer-capture-session.ts: PointerCaptureSession
  now exposes `allowInitialMiss` matching the same edge case (handle in separate layer).
-->

-

## Naming justifications

<!-- Any chronix name that might look similar to a k-ui name, or any name change you debated.
Example:
- Considered "DragSession" but chose "PointerCaptureSession" to be distinctive and
  signal that this owns pointer capture, not just drag.
-->

-

## Open questions / parked

-
