import {
  defaultIconProps,
  ensureChronixIconStyles,
  getIcon,
  resolveIconClassList,
  resolveIconRenderMode,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type SVGAttributes } from 'react';

export interface ChronixIconProps extends Omit<SVGAttributes<SVGElement>, 'name' | 'children'> {
  readonly name?: string;
  readonly size?: number;
}

export function ChronixIcon(props: ChronixIconProps): React.ReactElement {
  const { name = defaultIconProps.name, size = defaultIconProps.size, ...rest } = props;
  useEffect(() => {
    ensureChronixIconStyles();
  }, []);
  const className = useMemo(() => resolveIconClassList({ name, size }).join(' '), [name, size]);
  const mode = resolveIconRenderMode(name);
  if (mode === 'missing') {
    const style: CSSProperties = {
      width: `${size}px`,
      height: `${size}px`,
      lineHeight: `${size}px`,
    };
    return (
      <span className={className} aria-label={`missing icon: ${name}`} style={style}>
        ?
      </span>
    );
  }
  const spec = getIcon(name)!;
  return (
    <svg
      {...rest}
      className={className}
      viewBox={spec.viewBox}
      width={size}
      height={size}
      aria-hidden="true"
    >
      {spec.paths.map((p, idx) => (
        <path key={idx} d={p.d} fillRule={p.fillRule ?? 'nonzero'} />
      ))}
    </svg>
  );
}
