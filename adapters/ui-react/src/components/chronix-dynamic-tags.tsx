import {
  defaultDynamicTagsProps,
  ensureChronixDynamicTagsStyles,
  resolveDynamicTagsClassList,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

export interface ChronixDynamicTagsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly value?: readonly string[];
  readonly max?: number | undefined;
  readonly closable?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly onChange?: (value: string[]) => void;
  readonly children?: ReactNode;
}

/**
 * `<ChronixDynamicTags>` — React 18 port of the Phase 35 DynamicTags.
 * Renders an inline tag editor with add/remove capabilities.
 */
export function ChronixDynamicTags(props: ChronixDynamicTagsProps): JSX.Element {
  const {
    value = defaultDynamicTagsProps.value,
    max,
    closable = defaultDynamicTagsProps.closable,
    disabled = defaultDynamicTagsProps.disabled,
    onChange,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixDynamicTagsStyles();
  }, []);

  const classList = useMemo(() => resolveDynamicTagsClassList({ disabled }).join(' '), [disabled]);

  const handleClose = useCallback(
    (index: number) => {
      if (disabled) return;
      const next = [...value];
      next.splice(index, 1);
      onChange?.(next);
    },
    [disabled, value, onChange],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (event.key === 'Enter') {
        const input = event.currentTarget;
        const val = input.value.trim();
        if (val === '') return;
        if (max !== undefined && value.length >= max) return;
        onChange?.([...value, val]);
        input.value = '';
      }
    },
    [disabled, max, value, onChange],
  );

  return (
    <div data-testid="dynamic-tags-root" className={classList} {...rest}>
      {children !== undefined ? (
        children
      ) : (
        <>
          <div className="cx-ui-dynamic-tags__tags">
            {value.map((tag, index) => (
              <span key={index} className="cx-ui-dynamic-tags__tag">
                {tag}
                {closable && !disabled ? (
                  <button
                    type="button"
                    className="cx-ui-dynamic-tags__close"
                    onClick={() => handleClose(index)}
                  >
                    ×
                  </button>
                ) : null}
              </span>
            ))}
          </div>
          {!disabled ? (
            <input
              className="cx-ui-dynamic-tags__input"
              onKeyDown={handleKeyDown}
              placeholder="Press Enter to add"
            />
          ) : null}
        </>
      )}
    </div>
  );
}
