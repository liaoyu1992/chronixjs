import { defaultWaveProps, ensureChronixWaveStyles, resolveWaveClassList } from '@chronixjs/ui';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixWaveProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly color?: string;
  readonly duration?: number;
  readonly disabled?: boolean;
  readonly children?: ReactNode;
}

export function ChronixWave(props: ChronixWaveProps): React.ReactElement {
  const {
    color,
    duration = defaultWaveProps.duration,
    disabled = defaultWaveProps.disabled,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixWaveStyles();
  }, []);

  const [rippling, setRippling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimer(): void {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function onPointerDown(): void {
    if (disabled) return;
    clearTimer();
    setRippling(false);
    void Promise.resolve().then(() => {
      setRippling(true);
      timerRef.current = setTimeout(() => {
        setRippling(false);
        timerRef.current = null;
      }, duration);
    });
  }

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const style: CSSProperties | undefined =
    color !== undefined ? { ['--cx-ui-wave-color' as string]: color } : undefined;

  return (
    <span
      {...rest}
      className={resolveWaveClassList({ rippling, disabled }).join(' ')}
      style={style}
      onPointerDown={onPointerDown}
    >
      {children}
    </span>
  );
}
