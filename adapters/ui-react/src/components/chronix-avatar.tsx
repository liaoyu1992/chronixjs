import {
  defaultAvatarProps,
  ensureChronixAvatarStyles,
  resolveAvatarClassList,
  resolveAvatarContent,
  type AvatarShape,
} from '@chronixjs/ui';
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixAvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  readonly src?: string | undefined;
  readonly text?: string | undefined;
  readonly size?: number;
  readonly shape?: AvatarShape;
  readonly children?: ReactNode;
}

export function ChronixAvatar(props: ChronixAvatarProps): JSX.Element {
  const {
    src = defaultAvatarProps.src,
    text = defaultAvatarProps.text,
    size = defaultAvatarProps.size,
    shape = defaultAvatarProps.shape,
    children,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixAvatarStyles();
  }, []);
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedProps = { src, text, size, shape };
  const className = useMemo(
    () => resolveAvatarClassList(resolvedProps).join(' '),
    [src, text, size, shape],
  );
  const hasFallback = children !== undefined && children !== null;
  const mode = resolveAvatarContent({
    props: resolvedProps,
    imageFailed,
    hasFallback,
  });
  const style: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${Math.round(size * 0.4)}px`,
  };
  if (mode === 'image' && src !== undefined) {
    return (
      <span {...rest} className={className} style={style}>
        <img
          className="cx-ui-avatar__image"
          src={src}
          alt={text ?? ''}
          onError={() => setImageFailed(true)}
        />
      </span>
    );
  }
  if (mode === 'text') {
    return (
      <span {...rest} className={className} style={style}>
        {text ?? ''}
      </span>
    );
  }
  return (
    <span {...rest} className={className} style={style}>
      {children}
    </span>
  );
}
