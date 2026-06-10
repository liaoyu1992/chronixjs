import { defaultCodeProps, ensureChronixCodeStyles, resolveCodeClassList } from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes } from 'react';

export interface ChronixCodeProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly value?: string;
  readonly inline?: boolean;
}

export function ChronixCode(props: ChronixCodeProps): JSX.Element {
  const { value = defaultCodeProps.value, inline = defaultCodeProps.inline, ...rest } = props;
  useEffect(() => {
    ensureChronixCodeStyles();
  }, []);
  const className = useMemo(
    () => resolveCodeClassList({ value, inline }).join(' '),
    [value, inline],
  );
  if (inline) {
    return (
      <code {...rest} className={className}>
        {value}
      </code>
    );
  }
  return (
    <pre {...rest} className={className}>
      <code>{value}</code>
    </pre>
  );
}
