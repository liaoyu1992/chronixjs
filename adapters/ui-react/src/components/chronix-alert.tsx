import {
  defaultAlertProps,
  ensureChronixAlertStyles,
  resolveAlertClassList,
  type AlertProps,
  type AlertType,
} from '@chronixjs/ui';
import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

export interface ChronixAlertProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  readonly type?: AlertType;
  readonly title?: string | undefined;
  readonly closable?: boolean;
  readonly bordered?: boolean;
  readonly onClose?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  readonly children?: ReactNode;
}

/**
 * `<ChronixAlert>` — React 18 port of the Phase 15 Alert.
 */
export function ChronixAlert(props: ChronixAlertProps): JSX.Element {
  const {
    type = defaultAlertProps.type,
    title = defaultAlertProps.title,
    closable = defaultAlertProps.closable,
    bordered = defaultAlertProps.bordered,
    onClose,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixAlertStyles();
  }, []);

  const resolvedProps = useMemo<AlertProps>(
    () => ({ type, title, closable, bordered }),
    [type, title, closable, bordered],
  );

  const classList = useMemo(() => resolveAlertClassList(resolvedProps).join(' '), [resolvedProps]);

  const handleClose = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      onClose?.(event);
    },
    [onClose],
  );

  const hasContent = Children.count(children) > 0;

  return (
    <div {...rest} role="alert" className={classList}>
      {title !== undefined ? <div className="cx-ui-alert__title">{title}</div> : null}
      {hasContent ? <div className="cx-ui-alert__content">{children}</div> : null}
      {closable ? (
        <button
          type="button"
          className="cx-ui-alert__close"
          aria-label="Close"
          onClick={handleClose}
        >
          {'×'}
        </button>
      ) : null}
    </div>
  );
}
