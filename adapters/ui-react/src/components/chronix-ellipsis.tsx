import {
  defaultEllipsisProps,
  ensureChronixEllipsisStyles,
  resolveEllipsisClassList,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes } from 'react';

export interface ChronixEllipsisProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'content' | 'title'
> {
  readonly content?: string;
  readonly tooltip?: boolean;
  readonly lineClamp?: number;
}

/**
 * `<ChronixEllipsis>` — React port of the Ellipsis.
 *
 * Root element is `<span>` (NOT `<div>`) — 23-fr2: inline element
 * so it composes within inline flows. Props type uses
 * `HTMLSpanElement`. The `content` and `title` HTML attributes
 * are shadowed by the chronix props.
 *
 * When `tooltip=true` (default), the native HTML `title` attr is
 * set on the `<span>` with the full `content`. When `tooltip=false`,
 * no `title` is passed (React strips `undefined` attribute values).
 */
export function ChronixEllipsis(props: ChronixEllipsisProps): JSX.Element {
  const {
    content = defaultEllipsisProps.content,
    tooltip = defaultEllipsisProps.tooltip,
    lineClamp = defaultEllipsisProps.lineClamp,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixEllipsisStyles();
  }, []);

  const classList = useMemo(
    () => resolveEllipsisClassList({ content, tooltip, lineClamp }).join(' '),
    [content, tooltip, lineClamp],
  );

  const titleAttr = tooltip ? content : undefined;

  return (
    <span {...rest} className={classList} title={titleAttr}>
      {content}
    </span>
  );
}
