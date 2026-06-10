import { act, fireEvent, renderHook } from '@testing-library/react';
import { useRef, type RefObject } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { useChartScrollState } from './use-chart-scroll-state.js';

afterEach(() => {
  document.body.innerHTML = '';
});

/**
 * Helper: render the hook with a real <div> attached to document.body so
 * the scroll event listener actually fires. `renderHook` from
 * @testing-library/react mounts in a default container; we sidestep that
 * by appending our own div and passing a callback ref. Returns the hook
 * result + the div element for fireEvent + property mutation.
 */
function renderWithPane(): {
  result: { current: ReturnType<typeof useChartScrollState> };
  pane: HTMLDivElement;
  unmount: () => void;
} {
  const pane = document.createElement('div');
  document.body.appendChild(pane);
  const paneRef: RefObject<HTMLDivElement | null> = { current: pane };
  const hookHandle = renderHook(() => useChartScrollState(paneRef));
  return {
    result: hookHandle.result,
    pane,
    unmount: hookHandle.unmount,
  };
}

describe('useChartScrollState (Phase 32.5)', () => {
  it('initial state: scrollLeft 0 + clientWidth 0 when pane has default jsdom dimensions', () => {
    const { result } = renderWithPane();
    expect(result.current.scrollLeft).toBe(0);
    expect(result.current.clientWidth).toBe(0);
  });

  it('null-ref hook: returns 0/0 and does not throw', () => {
    const { result } = renderHook(() => {
      const nullRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
      return useChartScrollState(nullRef);
    });
    expect(result.current.scrollLeft).toBe(0);
    expect(result.current.clientWidth).toBe(0);
  });

  it('scroll event updates scrollLeft state', () => {
    const { result, pane } = renderWithPane();
    Object.defineProperty(pane, 'scrollLeft', { value: 120, configurable: true });
    act(() => {
      fireEvent.scroll(pane);
    });
    expect(result.current.scrollLeft).toBe(120);
  });

  it('clientWidth change reflects on next scroll event read (jsdom-friendly substitute for ResizeObserver)', () => {
    const { result, pane } = renderWithPane();
    Object.defineProperty(pane, 'clientWidth', { value: 800, configurable: true });
    // jsdom doesn't fire ResizeObserver, so any subsequent scroll-like
    // event that triggers readState() picks up the new clientWidth too.
    act(() => {
      fireEvent.scroll(pane);
    });
    expect(result.current.clientWidth).toBe(800);
  });

  it('unmount: scroll events after unmount do not throw and do not update state', () => {
    const { result, pane, unmount } = renderWithPane();
    Object.defineProperty(pane, 'scrollLeft', { value: 50, configurable: true });
    act(() => {
      fireEvent.scroll(pane);
    });
    expect(result.current.scrollLeft).toBe(50);
    const lastState = result.current;
    unmount();
    // Update the property + fire scroll AFTER unmount; cleanup should have
    // removed the listener so state stays frozen.
    Object.defineProperty(pane, 'scrollLeft', { value: 999, configurable: true });
    expect(() => fireEvent.scroll(pane)).not.toThrow();
    // result.current reflects the last commit state — unchanged.
    expect(result.current).toBe(lastState);
  });
});
