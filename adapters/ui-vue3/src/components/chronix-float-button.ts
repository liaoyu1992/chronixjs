import {
  defaultFloatButtonProps,
  ensureChronixFloatButtonStyles,
  getIcon,
  resolveFloatButtonClassList,
  resolveFloatButtonPositionStyle,
  type FloatButtonShape,
  type FloatButtonType,
} from '@chronixjs/ui';
import { defineComponent, h, type PropType, type VNode } from 'vue';

import { ChronixTooltip } from './chronix-tooltip.js';

/**
 * `<ChronixFloatButton>` — Vue 3. Phase 28 (2026-06-04). Fixed-position
 * floating action button. Wraps in `<ChronixTooltip>` when `tooltip`
 * prop is set.
 */
export const ChronixFloatButton = defineComponent({
  name: 'ChronixFloatButton',
  props: {
    shape: {
      type: String as PropType<FloatButtonShape>,
      default: defaultFloatButtonProps.shape,
    },
    type: {
      type: String as PropType<FloatButtonType>,
      default: defaultFloatButtonProps.type,
    },
    right: { type: Number, default: defaultFloatButtonProps.right },
    bottom: { type: Number, default: defaultFloatButtonProps.bottom },
    top: {
      type: Number as PropType<number | undefined>,
      default: defaultFloatButtonProps.top,
    },
    left: {
      type: Number as PropType<number | undefined>,
      default: defaultFloatButtonProps.left,
    },
    icon: {
      type: String as PropType<string | undefined>,
      default: defaultFloatButtonProps.icon,
    },
    tooltip: {
      type: String as PropType<string | undefined>,
      default: defaultFloatButtonProps.tooltip,
    },
    description: {
      type: String as PropType<string | undefined>,
      default: defaultFloatButtonProps.description,
    },
  },
  emits: {
    click: (_event: MouseEvent) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixFloatButtonStyles();

    function onClick(event: MouseEvent): void {
      emit('click', event);
    }

    function renderIcon(): VNode {
      const slotFn = slots['default'];
      if (slotFn !== undefined) {
        return h('span', { class: 'cx-ui-float-button__icon' }, slotFn());
      }
      const iconSpec = props.icon !== undefined ? getIcon(props.icon) : undefined;
      if (iconSpec === undefined) {
        return h('span', { class: 'cx-ui-float-button__icon' }, '');
      }
      return h('span', { class: 'cx-ui-float-button__icon' }, [
        h(
          'svg',
          {
            viewBox: iconSpec.viewBox,
            width: 18,
            height: 18,
            fill: 'currentColor',
            'aria-hidden': 'true',
          },
          iconSpec.paths.map((p) =>
            h('path', {
              d: p.d,
              ...(p.fillRule !== undefined ? { 'fill-rule': p.fillRule } : {}),
            }),
          ),
        ),
      ]);
    }

    return () => {
      const positionStyle = resolveFloatButtonPositionStyle({
        right: props.right,
        bottom: props.bottom,
        top: props.top,
        left: props.left,
      });
      const children: VNode[] = [renderIcon()];
      if (props.description !== undefined) {
        children.push(h('span', { class: 'cx-ui-float-button__description' }, props.description));
      }
      const button = h(
        'button',
        {
          type: 'button',
          class: resolveFloatButtonClassList({ shape: props.shape, type: props.type }),
          style: positionStyle,
          onClick,
        },
        children,
      );
      if (props.tooltip !== undefined) {
        return h(ChronixTooltip, { content: props.tooltip, trigger: 'hover' }, () => [button]);
      }
      return button;
    };
  },
});
