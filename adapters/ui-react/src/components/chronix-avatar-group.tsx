import {
  defaultAvatarGroupProps,
  ensureChronixAvatarGroupStyles,
  resolveAvatarGroupClassList,
  splitAvatarGroupItems,
  type AvatarItem,
  type AvatarShape,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes } from 'react';

import { ChronixAvatar } from './chronix-avatar.js';

export interface ChronixAvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly items?: readonly AvatarItem[];
  readonly max?: number;
  readonly size?: number;
  readonly shape?: AvatarShape;
}

export function ChronixAvatarGroup(props: ChronixAvatarGroupProps): React.ReactElement {
  const {
    items = defaultAvatarGroupProps.items,
    max = defaultAvatarGroupProps.max,
    size = defaultAvatarGroupProps.size,
    shape = defaultAvatarGroupProps.shape,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixAvatarGroupStyles();
  }, []);
  const className = useMemo(
    () => resolveAvatarGroupClassList({ items, max, size, shape }).join(' '),
    [items, max, size, shape],
  );
  const split = splitAvatarGroupItems(items, max);
  const overflowStyle: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${Math.round(size * 0.4)}px`,
  };
  return (
    <div {...rest} className={className}>
      {split.visible.map((item) => (
        <ChronixAvatar key={item.key} src={item.src} text={item.text} size={size} shape={shape} />
      ))}
      {split.hiddenCount > 0 ? (
        <span
          className={`cx-ui-avatar cx-ui-avatar--${shape} cx-ui-avatar-group__overflow`}
          style={overflowStyle}
        >
          {`+${split.hiddenCount}`}
        </span>
      ) : null}
    </div>
  );
}
