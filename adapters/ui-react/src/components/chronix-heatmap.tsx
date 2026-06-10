import {
  defaultHeatmapProps,
  ensureChronixHeatmapStyles,
  findHeatmapValueRange,
  interpolateHeatmapColor,
  resolveHeatmapClassList,
} from '@chronixjs/ui';
import { useEffect, useMemo, type SVGAttributes } from 'react';

export interface ChronixHeatmapProps extends Omit<SVGAttributes<SVGElement>, 'children'> {
  readonly cells?: readonly (readonly number[])[];
  readonly cellSize?: number;
  readonly colorLow?: string;
  readonly colorHigh?: string;
}

export function ChronixHeatmap(props: ChronixHeatmapProps): JSX.Element {
  const {
    cells = defaultHeatmapProps.cells,
    cellSize = defaultHeatmapProps.cellSize,
    colorLow = defaultHeatmapProps.colorLow,
    colorHigh = defaultHeatmapProps.colorHigh,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixHeatmapStyles();
  }, []);
  const className = useMemo(
    () => resolveHeatmapClassList({ cells, cellSize, colorLow, colorHigh }).join(' '),
    [cells, cellSize, colorLow, colorHigh],
  );
  const cols = cells.length > 0 ? Math.max(...cells.map((r) => r.length)) : 0;
  const rows = cells.length;
  const { min, max } = findHeatmapValueRange(cells);
  return (
    <svg {...rest} className={className} width={cols * cellSize} height={rows * cellSize}>
      {cells.map((row, r) =>
        row.map((v, c) => (
          <rect
            key={`${r}-${c}`}
            className="cx-ui-heatmap__cell"
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill={interpolateHeatmapColor(v, min, max, colorLow, colorHigh)}
          />
        )),
      )}
    </svg>
  );
}
