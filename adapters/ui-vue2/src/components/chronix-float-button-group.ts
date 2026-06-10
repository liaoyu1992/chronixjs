import {
  DEFAULT_HOVER_ENTER_DELAY_MS,
  DEFAULT_HOVER_LEAVE_DELAY_MS,
  defaultFloatButtonGroupProps,
  ensureChronixFloatButtonGroupStyles,
  getIcon,
  resolveFloatButtonGroupClassList,
  resolveFloatButtonPositionStyle,
  type FloatButtonGroupTrigger,
  type FloatButtonShape,
} from '@chronixjs/ui';
import { defineComponent, h, onBeforeUnmount, ref, type PropType, type VNode } from 'vue';

export const ChronixFloatButtonGroup = defineComponent({
  name: 'ChronixFloatButtonGroup',
  props: {
    shape: {
      type: String as PropType<FloatButtonShape>,
      default: defaultFloatButtonGroupProps.shape,
    },
    trigger: {
      type: String as PropType<FloatButtonGroupTrigger | undefined>,
      default: defaultFloatButtonGroupProps.trigger,
    },
    right: { type: Number, default: defaultFloatButtonGroupProps.right },
    bottom: { type: Number, default: defaultFloatButtonGroupProps.bottom },
    top: {
      type: Number as PropType<number | undefined>,
      default: defaultFloatButtonGroupProps.top,
    },
    left: {
      type: Number as PropType<number | undefined>,
      default: defaultFloatButtonGroupProps.left,
    },
    description: {
      type: String as PropType<string | undefined>,
      default: defaultFloatButtonGroupProps.description,
    },
  },
  emits: {
    'update:expanded': (_expanded: boolean) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixFloatButtonGroupStyles();
    const expanded = ref(props.trigger === undefined);
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;

    function clearHoverTimer(): void {
      if (hoverTimer !== null) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    }

    function setExpanded(next: boolean): void {
      if (expanded.value === next) return;
      expanded.value = next;
      emit('update:expanded', next);
    }

    function onMainClick(): void {
      if (props.trigger !== 'click') return;
      setExpanded(!expanded.value);
    }

    function onGroupMouseEnter(): void {
      if (props.trigger !== 'hover') return;
      clearHoverTimer();
      hoverTimer = setTimeout(() => setExpanded(true), DEFAULT_HOVER_ENTER_DELAY_MS);
    }

    function onGroupMouseLeave(): void {
      if (props.trigger !== 'hover') return;
      clearHoverTimer();
      hoverTimer = setTimeout(() => setExpanded(false), DEFAULT_HOVER_LEAVE_DELAY_MS);
    }

    onBeforeUnmount(() => clearHoverTimer());

    return () => {
      const positionStyle = resolveFloatButtonPositionStyle({
        right: props.right,
        bottom: props.bottom,
        top: props.top,
        left: props.left,
      });
      const classes = resolveFloatButtonGroupClassList({
        shape: props.shape,
        trigger: props.trigger,
        expanded: expanded.value,
      });
      const children: VNode[] = [];
      const childContent = slots['default']?.() ?? [];
      children.push(h('div', { class: 'cx-ui-float-button-group__children' }, childContent));
      if (props.trigger !== undefined) {
        const plusIcon = getIcon('close');
        const triggerIcon = plusIcon
          ? h(
              'svg',
              {
                attrs: {
                  viewBox: plusIcon.viewBox,
                  width: 18,
                  height: 18,
                  fill: 'currentColor',
                  'aria-hidden': 'true',
                },
                style: { transform: expanded.value ? 'rotate(45deg)' : 'rotate(0deg)' },
              },
              plusIcon.paths.map((p) =>
                h('path', {
                  attrs: {
                    d: p.d,
                    ...(p.fillRule !== undefined ? { 'fill-rule': p.fillRule } : {}),
                  },
                }),
              ),
            )
          : h('span', expanded.value ? '×' : '+');
        children.push(
          h(
            'button',
            {
              class: `cx-ui-float-button cx-ui-float-button--shape-${props.shape} cx-ui-float-button--type-default cx-ui-float-button-group__trigger`,
              attrs: { type: 'button', 'aria-expanded': expanded.value ? 'true' : 'false' },
              on: { click: onMainClick },
            },
            [
              h('span', { class: 'cx-ui-float-button__icon' }, [triggerIcon]),
              ...(props.description !== undefined
                ? [h('span', { class: 'cx-ui-float-button__description' }, props.description)]
                : []),
            ],
          ),
        );
      }
      return h(
        'div',
        {
          class: classes,
          style: positionStyle,
          on: {
            mouseenter: onGroupMouseEnter,
            mouseleave: onGroupMouseLeave,
          },
        },
        children,
      );
    };
  },
});
