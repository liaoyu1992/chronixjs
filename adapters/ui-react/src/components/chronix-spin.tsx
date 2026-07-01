import {
  defaultSpinProps,
  ensureChronixSpinStyles,
  resolveSpinClassList,
  type SpinSize,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes } from 'react';

import { useUIContext } from '../hooks/use-ui-context.js';

/**
 * Props for `<ChronixSpin>` in the React adapter. Mirrors the Vue
 * adapters' prop bag.
 */
export interface ChronixSpinProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly size?: SpinSize | undefined;
  readonly show?: boolean;
  readonly description?: string | undefined;
}

/**
 * `<ChronixSpin>` — React port of the Spin. Verbatim surface
 * mirror of the Vue adapters; size falls back to `ChronixUIContext.size`
 * per Decision A.1.
 */
export function ChronixSpin(props: ChronixSpinProps): React.ReactElement {
  const {
    size,
    show = defaultSpinProps.show,
    description = defaultSpinProps.description,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixSpinStyles();
  }, []);

  const ctx = useUIContext();

  const resolvedProps = useMemo(
    () => ({
      size: size ?? ctx.size,
      show,
      description,
    }),
    [size, show, description, ctx.size],
  );

  const classList = useMemo(() => resolveSpinClassList(resolvedProps).join(' '), [resolvedProps]);

  return (
    <div {...rest} className={classList}>
      <div
        className="cx-ui-spin__indicator"
        role="status"
        aria-label={resolvedProps.description ?? 'loading'}
      />
      {resolvedProps.description !== undefined ? (
        <div className="cx-ui-spin__description">{resolvedProps.description}</div>
      ) : null}
    </div>
  );
}
