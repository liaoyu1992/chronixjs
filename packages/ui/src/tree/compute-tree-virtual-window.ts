export const DEFAULT_TREE_VIRTUAL_WINDOW_OVERSCAN = 3;

export interface ComputeTreeVirtualWindowInput {
  readonly visibleRowCount: number;
  readonly itemHeightPx: number;
  readonly scrollTop: number;
  readonly viewportHeight: number;
  readonly overscan?: number;
}

export interface TreeVirtualWindow {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly offsetTopPx: number;
  readonly totalHeightPx: number;
}

export function computeTreeVirtualWindow(input: ComputeTreeVirtualWindowInput): TreeVirtualWindow {
  const { visibleRowCount, itemHeightPx, scrollTop, viewportHeight } = input;
  const overscan = Math.max(0, input.overscan ?? DEFAULT_TREE_VIRTUAL_WINDOW_OVERSCAN);

  if (visibleRowCount <= 0 || itemHeightPx <= 0) {
    return { startIndex: 0, endIndex: 0, offsetTopPx: 0, totalHeightPx: 0 };
  }

  const totalHeightPx = visibleRowCount * itemHeightPx;

  if (viewportHeight <= 0) {
    return { startIndex: 0, endIndex: 0, offsetTopPx: 0, totalHeightPx };
  }

  const effectiveScrollTop = Math.max(0, scrollTop);
  const rawStart = Math.floor(effectiveScrollTop / itemHeightPx);
  const rawEnd = Math.ceil((effectiveScrollTop + viewportHeight) / itemHeightPx);

  const startIndex = Math.max(0, Math.min(visibleRowCount, rawStart - overscan));
  const endIndex = Math.max(startIndex, Math.min(visibleRowCount, rawEnd + overscan));
  const offsetTopPx = startIndex * itemHeightPx;

  return { startIndex, endIndex, offsetTopPx, totalHeightPx };
}
