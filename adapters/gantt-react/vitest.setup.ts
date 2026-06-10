import '@testing-library/jest-dom';

/**
 * jsdom@25 ships a `PointerEvent` constructor that doesn't extract the
 * init dictionary's `clientX` / `clientY` / `button` / `pointerId` /
 * `pointerType` properties (the constructor body is essentially empty).
 * Without a polyfill, `fireEvent.pointerDown(node, { clientX: 600, ... })`
 * dispatches a PointerEvent with `e.clientX === undefined` — every
 * `@chronixjs/gantt-react` SFC pointer test would receive zeroed
 * coordinates.
 *
 * Polyfill: extend `MouseEvent` (which DOES honor the init dict) and
 * tack on the pointer-specific fields manually. Mirrors the pattern
 * used by `@testing-library/user-event` for pre-PointerEvent browsers.
 */
class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly width: number;
  readonly height: number;
  readonly pressure: number;
  readonly tiltX: number;
  readonly tiltY: number;
  readonly isPrimary: boolean;

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
    this.pointerType = params.pointerType ?? '';
    this.width = params.width ?? 1;
    this.height = params.height ?? 1;
    this.pressure = params.pressure ?? 0;
    this.tiltX = params.tiltX ?? 0;
    this.tiltY = params.tiltY ?? 0;
    this.isPrimary = params.isPrimary ?? true;
  }
}

if (typeof window !== 'undefined') {
  (window as unknown as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent =
    PointerEventPolyfill;
  (globalThis as unknown as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent =
    PointerEventPolyfill;
}
