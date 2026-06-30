import {
  defaultQrCodeProps,
  encodeQrCodeMatrix,
  ensureChronixQrCodeStyles,
  resolveQrCodeClassList,
  type QrCodeErrorCorrectionLevel,
} from '@chronixjs/ui';
import { useEffect, useMemo, type CSSProperties, type HTMLAttributes } from 'react';

export interface ChronixQrCodeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly value?: string;
  readonly size?: number;
  readonly errorCorrectionLevel?: QrCodeErrorCorrectionLevel;
  readonly foreground?: string;
  readonly background?: string;
}

/**
 * `<ChronixQrCode>` — React port of the QrCode.
 *
 * Renders an `<svg>` when an encoder factory has been registered
 * via `registerQrCodeEncoder(qrcode)` AND the value encodes
 * successfully. Otherwise renders the `--unavailable`
 * placeholder.
 */
export function ChronixQrCode(props: ChronixQrCodeProps): React.ReactElement {
  const {
    value = defaultQrCodeProps.value,
    size = defaultQrCodeProps.size,
    errorCorrectionLevel = defaultQrCodeProps.errorCorrectionLevel,
    foreground = defaultQrCodeProps.foreground,
    background = defaultQrCodeProps.background,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixQrCodeStyles();
  }, []);

  const matrix = useMemo(
    () => encodeQrCodeMatrix(value, errorCorrectionLevel),
    [value, errorCorrectionLevel],
  );
  const isUnavailable = matrix === undefined;

  const classList = useMemo(
    () =>
      resolveQrCodeClassList(
        { value, size, errorCorrectionLevel, foreground, background },
        isUnavailable,
      ).join(' '),
    [value, size, errorCorrectionLevel, foreground, background, isUnavailable],
  );

  if (isUnavailable) {
    const style: CSSProperties = {
      width: `${size}px`,
      height: `${size}px`,
    };
    return (
      <div {...rest} className={classList} style={style}>
        <div className="cx-ui-qrcode__unavailable-message">QR encoder unavailable</div>
      </div>
    );
  }

  const moduleCount = matrix.length;

  return (
    <div {...rest} className={classList}>
      <svg
        className="cx-ui-qrcode__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${moduleCount} ${moduleCount}`}
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        <rect x={0} y={0} width={moduleCount} height={moduleCount} fill={background} />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill={foreground} />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
}
