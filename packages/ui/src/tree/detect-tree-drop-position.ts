export type TreeDropPosition = 'before' | 'inside' | 'after';

export function detectTreeDropPosition(input: {
  readonly pointerYInRow: number;
  readonly rowHeight: number;
}): TreeDropPosition {
  const { pointerYInRow, rowHeight } = input;
  const ratio = rowHeight > 0 ? pointerYInRow / rowHeight : 0;
  if (ratio < 0.25) return 'before';
  if (ratio > 0.75) return 'after';
  return 'inside';
}
