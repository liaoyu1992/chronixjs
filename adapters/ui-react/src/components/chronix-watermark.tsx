import {
  defaultWatermarkProps,
  encodeWatermarkSvgDataUrl,
  ensureChronixWatermarkStyles,
  resolveWatermarkClassList,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixWatermarkProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  readonly content?: string;
  readonly width?: number;
  readonly height?: number;
  readonly rotate?: number;
  readonly fontSize?: number;
  readonly color?: string;
  readonly opacity?: number;
  readonly children?: ReactNode;
}

/**
 * `<ChronixWatermark>` — React port of the Phase 22 Watermark.
 *
 * Root element is `<div>`. The native `content` HTML attribute is
 * shadowed by the chronix prop (`Omit<HTMLAttributes, 'content'>`);
 * pass-through HTML attributes via spread otherwise.
 */
export function ChronixWatermark(props: ChronixWatermarkProps): JSX.Element {
  const {
    content = defaultWatermarkProps.content,
    width = defaultWatermarkProps.width,
    height = defaultWatermarkProps.height,
    rotate = defaultWatermarkProps.rotate,
    fontSize = defaultWatermarkProps.fontSize,
    color = defaultWatermarkProps.color,
    opacity = defaultWatermarkProps.opacity,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixWatermarkStyles();
  }, []);

  const classList = useMemo(
    () =>
      resolveWatermarkClassList({
        content,
        width,
        height,
        rotate,
        fontSize,
        color,
        opacity,
      }).join(' '),
    [content, width, height, rotate, fontSize, color, opacity],
  );

  const dataUrl = useMemo(
    () =>
      encodeWatermarkSvgDataUrl({
        content,
        width,
        height,
        rotate,
        fontSize,
        color,
        opacity,
      }),
    [content, width, height, rotate, fontSize, color, opacity],
  );

  const style: CSSProperties = {
    backgroundImage: `url(${dataUrl})`,
    backgroundSize: `${width}px ${height}px`,
  };

  return (
    <div {...rest} className={classList} style={style}>
      <div className="cx-ui-watermark__content">{children}</div>
    </div>
  );
}
