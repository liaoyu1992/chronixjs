import {
  defaultButtonProps,
  ensureChronixButtonStyles,
  resolveButtonClassList,
  type ButtonHtmlType,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

import { useUIContext } from '../hooks/use-ui-context.js';

/**
 * Props for `<ChronixButton>` in the React adapter. Mirrors the Vue
 * adapters' prop bag but uses React idioms:
 *
 * - `onClick` (callback prop) instead of `@click` emit.
 * - `children` for label content instead of default slot.
 * - All standard `<button>` HTML attributes pass through via
 *   `...rest`, so consumers can attach `data-testid`, `aria-*`, etc.
 */
export interface ChronixButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'disabled' | 'type' | 'onClick'
> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize | undefined;
  readonly disabled?: boolean | undefined;
  readonly block?: boolean;
  readonly htmlType?: ButtonHtmlType;
  readonly onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  readonly children?: ReactNode;
}

/**
 * `<ChronixButton>` — React component wrapping the core `ButtonProps`
 * IR. Verbatim port of the Vue 3 + Vue 2 adapters; same resolved
 * props, same class list, same DOM shape (cross-adapter parity is
 * structural by construction, since all three consume the same
 * `resolveButtonClassList` and the same `CHRONIX_BUTTON_CSS`).
 *
 * . Behavior follows Decision A.1
 * default-merge precedence (own prop strict → context → interface
 * default).
 */
export function ChronixButton(props: ChronixButtonProps): React.ReactElement {
  const {
    variant = defaultButtonProps.variant,
    size,
    disabled,
    block = defaultButtonProps.block,
    htmlType = defaultButtonProps.htmlType,
    onClick,
    children,
    ...rest
  } = props;

  // CSS injection — `ensureChronixButtonStyles` is idempotent, but we
  // run it in an effect so the call only fires on mount in browser
  // environments (matches the Vue adapters' setup-time injection in
  // semantics; React doesn't run setup off the render path).
  useEffect(() => {
    ensureChronixButtonStyles();
  }, []);

  const ctx = useUIContext();

  const resolvedProps = useMemo<ButtonProps>(
    () => ({
      variant,
      size: size ?? ctx.size,
      disabled: disabled ?? ctx.disabled,
      block,
      htmlType,
    }),
    [variant, size, disabled, block, htmlType, ctx.size, ctx.disabled],
  );

  const classList = useMemo(() => resolveButtonClassList(resolvedProps).join(' '), [resolvedProps]);

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (resolvedProps.disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    },
    [resolvedProps.disabled, onClick],
  );

  return (
    <button
      {...rest}
      type={resolvedProps.htmlType}
      className={classList}
      disabled={resolvedProps.disabled}
      aria-disabled={resolvedProps.disabled ? 'true' : undefined}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
