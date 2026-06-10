import {
  defaultAffixProps,
  ensureChronixAffixStyles,
  resolveAffixClassList,
  resolveAffixState,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixAffixProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly top?: number | undefined;
  readonly bottom?: number | undefined;
  readonly children?: ReactNode;
  readonly onChange?: (affixed: boolean) => void;
}

export function ChronixAffix(props: ChronixAffixProps): JSX.Element {
  const {
    top = defaultAffixProps.top,
    bottom = defaultAffixProps.bottom,
    children,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixAffixStyles();
  }, []);

  const placeholderRef = useRef<HTMLDivElement>(null);
  const [affixed, setAffixed] = useState(false);
  const [inlineStyle, setInlineStyle] = useState<Record<string, string>>({});
  const [placeholderHeight, setPlaceholderHeight] = useState(0);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const recompute = useCallback(() => {
    if (typeof window === 'undefined') return;
    const el = placeholderRef.current;
    if (el === null) return;
    const rect = el.getBoundingClientRect();
    setPlaceholderHeight(rect.height);
    const result = resolveAffixState({
      top,
      bottom,
      placeholderRect: {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
      },
      viewportHeight: window.innerHeight,
    });
    setAffixed((prev) => {
      if (prev !== result.affixed) {
        onChangeRef.current?.(result.affixed);
      }
      return result.affixed;
    });
    setInlineStyle(result.inlineStyle);
  }, [top, bottom]);

  useEffect(() => {
    recompute();
    if (typeof window === 'undefined') return;
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    window.addEventListener('scroll', recompute, opts);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [recompute]);

  const placeholderStyle = affixed ? { height: `${placeholderHeight}px` } : undefined;

  return (
    <div
      {...rest}
      ref={placeholderRef}
      className="cx-ui-affix-placeholder"
      style={placeholderStyle}
    >
      <div className={resolveAffixClassList({ affixed }).join(' ')} style={inlineStyle}>
        {children}
      </div>
    </div>
  );
}
