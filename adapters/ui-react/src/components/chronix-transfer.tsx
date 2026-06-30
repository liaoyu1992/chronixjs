import {
  computeTransferLists,
  defaultTransferProps,
  ensureChronixTransferStyles,
  filterTransferOptions,
  resolveTransferItemClassList,
  resolveTransferPanelClassList,
  resolveTransferRootClassList,
  type TransferOption,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react';

export interface ChronixTransferProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly options?: readonly TransferOption[];
  readonly value?: readonly (string | number)[];
  readonly disabled?: boolean | undefined;
  readonly sourceTitle?: string;
  readonly targetTitle?: string;
  readonly filterable?: boolean | undefined;
  readonly onChange?: (value: (string | number)[]) => void;
}

export function ChronixTransfer(props: ChronixTransferProps): React.ReactElement {
  const {
    options = defaultTransferProps.options,
    value = defaultTransferProps.value,
    disabled = defaultTransferProps.disabled,
    sourceTitle = defaultTransferProps.sourceTitle,
    targetTitle = defaultTransferProps.targetTitle,
    filterable = defaultTransferProps.filterable,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixTransferStyles();
  }, []);

  const [sourceFilter, setSourceFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());

  const { source, target } = useMemo(() => computeTransferLists(options, value), [options, value]);

  const filteredSource = useMemo(
    () => filterTransferOptions(source, sourceFilter),
    [source, sourceFilter],
  );

  const filteredTarget = useMemo(
    () => filterTransferOptions(target, targetFilter),
    [target, targetFilter],
  );

  const rootClassName = useMemo(
    () => resolveTransferRootClassList({ disabled: disabled ?? false }).join(' '),
    [disabled],
  );

  const toggleKey = useCallback((key: string | number) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const moveToTarget = useCallback(() => {
    const newTarget = [...value];
    for (const key of selectedKeys) {
      if (!newTarget.includes(key)) newTarget.push(key);
    }
    onChange?.(newTarget);
    setSelectedKeys(new Set());
  }, [value, selectedKeys, onChange]);

  const moveToSource = useCallback(() => {
    const newTarget = value.filter((v) => !selectedKeys.has(v));
    onChange?.(newTarget);
    setSelectedKeys(new Set());
  }, [value, selectedKeys, onChange]);

  const sourceItemNodes = filteredSource.map((opt) => {
    const isChecked = selectedKeys.has(opt.value);
    return (
      <div
        key={opt.value}
        className={resolveTransferItemClassList({
          checked: isChecked,
          disabled: opt.disabled ?? false,
        }).join(' ')}
        data-testid={`transfer-source-${opt.value}`}
        onClick={() => {
          if (!disabled && !opt.disabled) toggleKey(opt.value);
        }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          disabled={disabled || opt.disabled}
          readOnly
          aria-label={opt.label}
        />
        <span>{opt.label}</span>
      </div>
    );
  });

  const targetItemNodes = filteredTarget.map((opt) => {
    const isChecked = selectedKeys.has(opt.value);
    return (
      <div
        key={opt.value}
        className={resolveTransferItemClassList({
          checked: isChecked,
          disabled: opt.disabled ?? false,
        }).join(' ')}
        data-testid={`transfer-target-${opt.value}`}
        onClick={() => {
          if (!disabled && !opt.disabled) toggleKey(opt.value);
        }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          disabled={disabled || opt.disabled}
          readOnly
          aria-label={opt.label}
        />
        <span>{opt.label}</span>
      </div>
    );
  });

  return (
    <div {...rest} className={rootClassName} data-testid="transfer-root">
      <div
        className={resolveTransferPanelClassList({ position: 'source' }).join(' ')}
        data-testid="transfer-source"
      >
        <div className="cx-ui-transfer__header">
          <span className="cx-ui-transfer__header-title">{sourceTitle}</span>
        </div>
        {filterable && (
          <div className="cx-ui-transfer__filter">
            <input
              className="cx-ui-transfer__filter-input"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              placeholder="Search..."
              data-testid="transfer-source-filter"
            />
          </div>
        )}
        <div className="cx-ui-transfer__body">{sourceItemNodes}</div>
      </div>

      <div className="cx-ui-transfer__actions">
        <button
          className="cx-ui-transfer__action-btn"
          onClick={moveToTarget}
          disabled={disabled || selectedKeys.size === 0}
          data-testid="transfer-to-target"
        >
          &rarr;
        </button>
        <button
          className="cx-ui-transfer__action-btn"
          onClick={moveToSource}
          disabled={disabled || selectedKeys.size === 0}
          data-testid="transfer-to-source"
        >
          &larr;
        </button>
      </div>

      <div
        className={resolveTransferPanelClassList({ position: 'target' }).join(' ')}
        data-testid="transfer-target"
      >
        <div className="cx-ui-transfer__header">
          <span className="cx-ui-transfer__header-title">{targetTitle}</span>
        </div>
        {filterable && (
          <div className="cx-ui-transfer__filter">
            <input
              className="cx-ui-transfer__filter-input"
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              placeholder="Search..."
              data-testid="transfer-target-filter"
            />
          </div>
        )}
        <div className="cx-ui-transfer__body">{targetItemNodes}</div>
      </div>
    </div>
  );
}
