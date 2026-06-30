import {
  defaultTypographyProps,
  ensureChronixTypographyStyles,
  getTypographyTag,
  resolveTypographyClassList,
  type TypographyLevel,
  type TypographyVariant,
} from '@chronixjs/ui';
import { createElement, useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixTypographyProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  readonly variant?: TypographyVariant;
  readonly level?: TypographyLevel;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly children?: ReactNode;
}

export function ChronixTypography(props: ChronixTypographyProps): React.ReactElement {
  const {
    variant = defaultTypographyProps.variant,
    level = defaultTypographyProps.level,
    italic = defaultTypographyProps.italic,
    underline = defaultTypographyProps.underline,
    children,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixTypographyStyles();
  }, []);
  const resolvedProps = { variant, level, italic, underline };
  const className = useMemo(
    () => resolveTypographyClassList(resolvedProps).join(' '),
    [variant, level, italic, underline],
  );
  const tag = getTypographyTag(resolvedProps);
  if (variant === 'hr') {
    return createElement(tag, { ...rest, className });
  }
  return createElement(tag, { ...rest, className }, children);
}
