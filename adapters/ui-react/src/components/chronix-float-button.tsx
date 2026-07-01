import {
  defaultFloatButtonProps,
  ensureChronixFloatButtonStyles,
  getIcon,
  resolveFloatButtonClassList,
  resolveFloatButtonPositionStyle,
  type FloatButtonShape,
  type FloatButtonType,
} from '@chronixjs/ui';
import {
  useEffect,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';

import { ChronixTooltip } from './chronix-tooltip.js';

export interface ChronixFloatButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onClick' | 'type'
> {
  readonly shape?: FloatButtonShape;
  readonly type?: FloatButtonType;
  readonly right?: number;
  readonly bottom?: number;
  readonly top?: number;
  readonly left?: number;
  readonly icon?: string;
  readonly tooltip?: string;
  readonly description?: string;
  readonly children?: ReactNode;
  readonly onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export function ChronixFloatButton(props: ChronixFloatButtonProps): React.ReactElement {
  const {
    shape = defaultFloatButtonProps.shape,
    type = defaultFloatButtonProps.type,
    right = defaultFloatButtonProps.right,
    bottom = defaultFloatButtonProps.bottom,
    top,
    left,
    icon,
    tooltip,
    description,
    children,
    onClick,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixFloatButtonStyles();
  }, []);

  const positionStyle = resolveFloatButtonPositionStyle({
    right,
    bottom,
    top,
    left,
  });

  function renderIcon(): ReactNode {
    if (children !== undefined) {
      return <span className="cx-ui-float-button__icon">{children}</span>;
    }
    const iconSpec = icon !== undefined ? getIcon(icon) : undefined;
    if (iconSpec === undefined) {
      return <span className="cx-ui-float-button__icon" />;
    }
    return (
      <span className="cx-ui-float-button__icon">
        <svg
          viewBox={iconSpec.viewBox}
          width={18}
          height={18}
          fill="currentColor"
          aria-hidden="true"
        >
          {iconSpec.paths.map((p, i) =>
            p.fillRule !== undefined ? (
              <path key={i} d={p.d} fillRule={p.fillRule} />
            ) : (
              <path key={i} d={p.d} />
            ),
          )}
        </svg>
      </span>
    );
  }

  const button = (
    <button
      {...rest}
      type="button"
      className={resolveFloatButtonClassList({ shape, type }).join(' ')}
      style={positionStyle}
      onClick={onClick}
    >
      {renderIcon()}
      {description !== undefined ? (
        <span className="cx-ui-float-button__description">{description}</span>
      ) : null}
    </button>
  );

  if (tooltip !== undefined) {
    return (
      <ChronixTooltip content={tooltip} trigger="hover">
        {button}
      </ChronixTooltip>
    );
  }
  return button;
}
