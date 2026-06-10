import {
  defaultHighlightProps,
  ensureChronixHighlightStyles,
  resolveHighlightClassList,
  splitHighlightSegments,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes } from 'react';

export interface ChronixHighlightProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly value?: string;
  readonly pattern?: string;
  readonly caseSensitive?: boolean;
}

export function ChronixHighlight(props: ChronixHighlightProps): JSX.Element {
  const {
    value = defaultHighlightProps.value,
    pattern = defaultHighlightProps.pattern,
    caseSensitive = defaultHighlightProps.caseSensitive,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixHighlightStyles();
  }, []);
  const resolvedProps = { value, pattern, caseSensitive };
  const className = useMemo(
    () => resolveHighlightClassList(resolvedProps).join(' '),
    [value, pattern, caseSensitive],
  );
  const segments = splitHighlightSegments(resolvedProps);
  return (
    <span {...rest} className={className}>
      {segments.map((seg, idx) =>
        seg.matched ? (
          <mark key={idx} className="cx-ui-highlight__match">
            {seg.text}
          </mark>
        ) : (
          <span key={idx}>{seg.text}</span>
        ),
      )}
    </span>
  );
}
