import {
  computePaginationPages,
  defaultPaginationProps,
  ensureChronixPaginationStyles,
  resolvePaginationButtonClassList,
  resolvePaginationItemClassList,
  resolvePaginationRootClassList,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react';

export interface ChronixPaginationProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly page?: number;
  readonly pageCount?: number;
  readonly pageSlot?: number;
  readonly disabled?: boolean | undefined;
  readonly showQuickJumper?: boolean | undefined;
  readonly onChange?: (page: number) => void;
}

export function ChronixPagination(props: ChronixPaginationProps): JSX.Element {
  const {
    page = defaultPaginationProps.page,
    pageCount = defaultPaginationProps.pageCount,
    pageSlot = defaultPaginationProps.pageSlot,
    disabled = defaultPaginationProps.disabled,
    showQuickJumper = defaultPaginationProps.showQuickJumper,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixPaginationStyles();
  }, []);

  const [jumperInput, setJumperInput] = useState('');

  const pages = useMemo(
    () => computePaginationPages(page, pageCount, pageSlot),
    [page, pageCount, pageSlot],
  );

  const rootClassName = useMemo(
    () => resolvePaginationRootClassList({ disabled: disabled ?? false }).join(' '),
    [disabled],
  );

  const goToPage = useCallback(
    (p: number) => {
      if (disabled) return;
      if (p < 1 || p > pageCount) return;
      onChange?.(p);
    },
    [disabled, pageCount, onChange],
  );

  const handleJumper = useCallback(() => {
    const p = parseInt(jumperInput, 10);
    if (!isNaN(p)) goToPage(p);
    setJumperInput('');
  }, [jumperInput, goToPage]);

  const itemNodes = pages.map((entry, i) => {
    if (entry === null) {
      return (
        <span key={`ellipsis-${i}`} className="cx-ui-pagination__ellipsis">
          …
        </span>
      );
    }

    const isActive = entry === page;
    const classes = resolvePaginationItemClassList({
      active: isActive,
      disabled: disabled ?? false,
    }).join(' ');

    return (
      <button
        key={`page-${entry}`}
        className={classes}
        disabled={disabled}
        onClick={() => goToPage(entry)}
        data-testid={`pagination-page-${entry}`}
        aria-current={isActive ? ('page' as const) : undefined}
        aria-disabled={disabled || undefined}
      >
        {entry}
      </button>
    );
  });

  return (
    <div {...rest} className={rootClassName} data-testid="pagination-root">
      <button
        className={resolvePaginationButtonClassList({
          disabled: (disabled ?? false) || page <= 1,
        }).join(' ')}
        disabled={disabled || page <= 1}
        onClick={() => goToPage(page - 1)}
        data-testid="pagination-prev"
        aria-disabled={disabled || page <= 1 || undefined}
      >
        &lsaquo;
      </button>
      {itemNodes}
      <button
        className={resolvePaginationButtonClassList({
          disabled: (disabled ?? false) || page >= pageCount,
        }).join(' ')}
        disabled={disabled || page >= pageCount}
        onClick={() => goToPage(page + 1)}
        data-testid="pagination-next"
        aria-disabled={disabled || page >= pageCount || undefined}
      >
        &rsaquo;
      </button>
      {showQuickJumper && (
        <div className="cx-ui-pagination__jumper">
          <span>Go to</span>
          <input
            className="cx-ui-pagination__jumper-input"
            value={jumperInput}
            data-testid="pagination-jumper"
            onChange={(e) => setJumperInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleJumper();
            }}
          />
        </div>
      )}
    </div>
  );
}
