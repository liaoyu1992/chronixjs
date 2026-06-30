import {
  defaultStatisticProps,
  ensureChronixStatisticStyles,
  formatStatisticValue,
  resolveStatisticClassList,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixStatisticProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'prefix'
> {
  readonly label?: string | undefined;
  readonly value?: number | string | undefined;
  readonly precision?: number | undefined;
  readonly tabularNums?: boolean;
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
}

/**
 * `<ChronixStatistic>` — React port of the Statistic.
 */
export function ChronixStatistic(props: ChronixStatisticProps): JSX.Element {
  const {
    label = defaultStatisticProps.label,
    value = defaultStatisticProps.value,
    precision = defaultStatisticProps.precision,
    tabularNums = defaultStatisticProps.tabularNums,
    prefix,
    suffix,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixStatisticStyles();
  }, []);

  const hasPrefix = prefix !== undefined && prefix !== null;
  const hasSuffix = suffix !== undefined && suffix !== null;

  const classList = useMemo(
    () =>
      resolveStatisticClassList(
        { label, value, precision, tabularNums },
        hasPrefix,
        hasSuffix,
      ).join(' '),
    [label, value, precision, tabularNums, hasPrefix, hasSuffix],
  );

  const display = useMemo(() => formatStatisticValue(value, precision), [value, precision]);

  return (
    <div {...rest} className={classList}>
      {label !== undefined ? <div className="cx-ui-statistic__label">{label}</div> : null}
      <div className="cx-ui-statistic__content">
        {hasPrefix ? <span className="cx-ui-statistic__prefix">{prefix}</span> : null}
        <span className="cx-ui-statistic__value">{display}</span>
        {hasSuffix ? <span className="cx-ui-statistic__suffix">{suffix}</span> : null}
      </div>
    </div>
  );
}
