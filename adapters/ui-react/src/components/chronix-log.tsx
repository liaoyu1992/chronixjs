import { defaultLogProps, ensureChronixLogStyles, resolveLogClassList } from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes } from 'react';

export interface ChronixLogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly lines?: readonly string[];
  readonly lineNumbers?: boolean;
  readonly loading?: boolean;
  readonly maxHeight?: number | undefined;
  readonly wrapLines?: boolean;
}

/**
 * `<ChronixLog>` — React port of the Log.
 *
 * Root `<div>` carries optional inline `maxHeight` + `overflow:
 * auto` style. Inner `<ol class="__lines">` iterates `lines` into
 * `<li>` rows; when `lineNumbers=true` each row prefixed with a
 * `<span class="__line-number" aria-hidden="true">` carrying the
 * integer text (D.1).
 */
export function ChronixLog(props: ChronixLogProps): JSX.Element {
  const {
    lines = defaultLogProps.lines,
    lineNumbers = defaultLogProps.lineNumbers,
    loading = defaultLogProps.loading,
    maxHeight = defaultLogProps.maxHeight,
    wrapLines = defaultLogProps.wrapLines,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixLogStyles();
  }, []);

  const classList = useMemo(
    () =>
      resolveLogClassList({
        lines,
        lineNumbers,
        loading,
        maxHeight,
        wrapLines,
      }).join(' '),
    [lines, lineNumbers, loading, maxHeight, wrapLines],
  );

  const rootStyle: CSSProperties | undefined =
    maxHeight !== undefined ? { maxHeight: `${maxHeight}px`, overflow: 'auto' } : undefined;

  return (
    <div {...rest} className={classList} style={rootStyle}>
      <ol className="cx-ui-log__lines">
        {lines.map((line, idx) => (
          <li key={idx} className="cx-ui-log__line">
            {lineNumbers ? (
              <span className="cx-ui-log__line-number" aria-hidden="true">
                {idx + 1}
              </span>
            ) : null}
            <span className="cx-ui-log__line-content">{line}</span>
          </li>
        ))}
      </ol>
      {loading ? <div className="cx-ui-log__loading">loading...</div> : null}
    </div>
  );
}
