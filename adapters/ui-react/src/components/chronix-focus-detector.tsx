import {
  defaultFocusDetectorProps,
  ensureChronixFocusDetectorStyles,
  resolveFocusDetectorClassList,
  shouldEmitFocusDetectorEvent,
} from '@chronixjs/ui';
import {
  useEffect,
  useRef,
  type FocusEvent as ReactFocusEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixFocusDetectorProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'onFocus' | 'onBlur'
> {
  readonly disabled?: boolean;
  readonly children?: ReactNode;
  readonly onFocus?: (event: ReactFocusEvent<HTMLSpanElement>) => void;
  readonly onBlur?: (event: ReactFocusEvent<HTMLSpanElement>) => void;
}

export function ChronixFocusDetector(props: ChronixFocusDetectorProps): React.ReactElement {
  const {
    disabled = defaultFocusDetectorProps.disabled,
    children,
    onFocus,
    onBlur,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixFocusDetectorStyles();
  }, []);

  const wrapperRef = useRef<HTMLSpanElement>(null);

  function handleFocusIn(event: ReactFocusEvent<HTMLSpanElement>): void {
    if (disabled) return;
    const wrapper = wrapperRef.current;
    if (wrapper === null) return;
    if (
      shouldEmitFocusDetectorEvent({
        currentTarget: wrapper,
        relatedTarget: event.relatedTarget as HTMLElement | null,
      })
    ) {
      onFocus?.(event);
    }
  }

  function handleFocusOut(event: ReactFocusEvent<HTMLSpanElement>): void {
    if (disabled) return;
    const wrapper = wrapperRef.current;
    if (wrapper === null) return;
    if (
      shouldEmitFocusDetectorEvent({
        currentTarget: wrapper,
        relatedTarget: event.relatedTarget as HTMLElement | null,
      })
    ) {
      onBlur?.(event);
    }
  }

  return (
    <span
      {...rest}
      ref={wrapperRef}
      className={resolveFocusDetectorClassList({ disabled }).join(' ')}
      onFocus={handleFocusIn}
      onBlur={handleFocusOut}
    >
      {children}
    </span>
  );
}
