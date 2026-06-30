import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useRef, type FC } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { useScrollSync } from './use-scroll-sync.js';

afterEach(() => {
  cleanup();
});

/**
 * Tiny host component exposing two scrollable divs + wiring
 * `useScrollSync` between them. Mirrors the vue3 test's mountHost()
 * helper. Refs are attached via React's ref-callback so the hook
 * sees the resolved nodes by the time its `useEffect` fires.
 */
const Host: FC<{ onlyOnePane?: boolean }> = ({ onlyOnePane = false }) => {
  const paneARef = useRef<HTMLDivElement | null>(null);
  const paneBRef = useRef<HTMLDivElement | null>(null);
  useScrollSync(paneARef, paneBRef);
  if (onlyOnePane) {
    return (
      <div>
        <div ref={paneARef} data-testid="pane-a" style={{ overflow: 'auto', height: '100px' }} />
      </div>
    );
  }
  return (
    <div>
      <div ref={paneARef} data-testid="pane-a" style={{ overflow: 'auto', height: '100px' }} />
      <div ref={paneBRef} data-testid="pane-b" style={{ overflow: 'auto', height: '100px' }} />
    </div>
  );
};

function nextRaf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('useScrollSync — React port of vue3 ', () => {
  it('scroll on paneA writes paneB.scrollTop (one-way forward)', async () => {
    const { getByTestId } = render(<Host />);
    const paneA = getByTestId('pane-a') as HTMLDivElement;
    const paneB = getByTestId('pane-b') as HTMLDivElement;
    paneA.scrollTop = 42;
    fireEvent.scroll(paneA);
    expect(paneB.scrollTop).toBe(42);
    await nextRaf();
  });

  it('scroll on paneB writes paneA.scrollTop (one-way reverse)', async () => {
    const { getByTestId } = render(<Host />);
    const paneA = getByTestId('pane-a') as HTMLDivElement;
    const paneB = getByTestId('pane-b') as HTMLDivElement;
    paneB.scrollTop = 17;
    fireEvent.scroll(paneB);
    expect(paneA.scrollTop).toBe(17);
    await nextRaf();
  });

  it('source-guard prevents writeback loop (B-from-A propagation does not bounce back)', async () => {
    const { getByTestId } = render(<Host />);
    const paneA = getByTestId('pane-a') as HTMLDivElement;
    const paneB = getByTestId('pane-b') as HTMLDivElement;

    paneA.scrollTop = 25;
    fireEvent.scroll(paneA);
    // Simulate the browser firing the post-write scroll event on B.
    // Source flag is still 'a' (rAF reset hasn't fired yet), so the
    // B-handler must bail without writing back to A.
    fireEvent.scroll(paneB);
    expect(paneA.scrollTop).toBe(25);
    expect(paneB.scrollTop).toBe(25);
    await nextRaf();
  });

  it('rAF reset allows the next scroll to propagate from either side', async () => {
    const { getByTestId } = render(<Host />);
    const paneA = getByTestId('pane-a') as HTMLDivElement;
    const paneB = getByTestId('pane-b') as HTMLDivElement;

    paneA.scrollTop = 10;
    fireEvent.scroll(paneA);
    expect(paneB.scrollTop).toBe(10);
    await nextRaf();

    paneB.scrollTop = 99;
    fireEvent.scroll(paneB);
    expect(paneA.scrollTop).toBe(99);
    await nextRaf();
  });

  it('null refs (e.g. no-sidebar mode) cause a silent no-op', () => {
    expect(() => {
      const { unmount } = render(<Host onlyOnePane />);
      unmount();
    }).not.toThrow();
  });

  it('unmount removes both scroll listeners cleanly', () => {
    const { getByTestId, unmount } = render(<Host />);
    const paneA = getByTestId('pane-a') as HTMLDivElement;
    const paneB = getByTestId('pane-b') as HTMLDivElement;

    // Drive a scroll pre-unmount to confirm wiring is live.
    paneA.scrollTop = 5;
    fireEvent.scroll(paneA);
    expect(paneB.scrollTop).toBe(5);

    act(() => {
      unmount();
    });

    // After unmount, scrolling either pane no longer mirrors the
    // other (handler detached).
    const orphanA = paneA;
    const orphanB = paneB;
    orphanA.scrollTop = 80;
    fireEvent.scroll(orphanA);
    expect(orphanB.scrollTop).toBe(5); // unchanged from pre-unmount value
  });
});
