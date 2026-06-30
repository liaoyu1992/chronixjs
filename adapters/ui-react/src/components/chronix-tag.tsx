import {
  defaultTagProps,
  ensureChronixTagStyles,
  resolveTagClassList,
  type TagProps,
  type TagSize,
  type TagType,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

import { useUIContext } from '../hooks/use-ui-context.js';

/**
 * Props for `<ChronixTag>` in the React adapter. Mirrors the Vue
 * adapters' prop bag but uses React idioms:
 *
 * - `onClose` (callback) instead of `@close` emit.
 * - `children` for label content instead of default slot.
 * - All standard `<span>` HTML attributes pass through via
 *   `...rest`.
 */
export interface ChronixTagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly type?: TagType;
  readonly size?: TagSize | undefined;
  readonly bordered?: boolean;
  readonly round?: boolean;
  readonly closable?: boolean;
  readonly disabled?: boolean | undefined;
  readonly onClose?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  readonly children?: ReactNode;
}

/**
 * `<ChronixTag>` — React 18 port of the Tag pilot. Verbatim
 * surface mirror of the Vue adapters; React idioms swapped in
 * (`onClose` callback, `children`).
 */
export function ChronixTag(props: ChronixTagProps): React.ReactElement {
  const {
    type = defaultTagProps.type,
    size,
    bordered = defaultTagProps.bordered,
    round = defaultTagProps.round,
    closable = defaultTagProps.closable,
    disabled,
    onClose,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixTagStyles();
  }, []);

  const ctx = useUIContext();

  const resolvedProps = useMemo<TagProps>(
    () => ({
      type,
      size: size ?? ctx.size,
      bordered,
      round,
      closable,
      disabled: disabled ?? ctx.disabled,
    }),
    [type, size, bordered, round, closable, disabled, ctx.size, ctx.disabled],
  );

  const classList = useMemo(() => resolveTagClassList(resolvedProps).join(' '), [resolvedProps]);

  const handleClose = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (resolvedProps.disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClose?.(event);
    },
    [resolvedProps.disabled, onClose],
  );

  return (
    <span {...rest} className={classList}>
      {children}
      {resolvedProps.closable ? (
        <button type="button" className="cx-ui-tag__close" aria-label="Close" onClick={handleClose}>
          {'×'}
        </button>
      ) : null}
    </span>
  );
}
