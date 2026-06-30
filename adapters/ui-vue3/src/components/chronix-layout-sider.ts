import {
  defaultLayoutSiderProps,
  ensureChronixLayoutStyles,
  getIcon,
  resolveBreakpointMediaQuery,
  resolveLayoutSiderClassList,
  resolveLayoutSiderWidthStyle,
  type LayoutSiderBreakpoint,
  type LayoutSiderPlacement,
} from '@chronixjs/ui';
import { defineComponent, h, onBeforeUnmount, onMounted, type PropType, type VNode } from 'vue';

/**
 * `<ChronixLayoutSider>` — Vue 3. . Collapsible
 * sidebar with optional chevron trigger button + optional breakpoint
 * auto-collapse via `window.matchMedia`.
 */
export const ChronixLayoutSider = defineComponent({
  name: 'ChronixLayoutSider',
  props: {
    width: {
      type: [Number, String] as PropType<number | string>,
      default: defaultLayoutSiderProps.width,
    },
    collapsedWidth: {
      type: [Number, String] as PropType<number | string>,
      default: defaultLayoutSiderProps.collapsedWidth,
    },
    collapsed: { type: Boolean, default: defaultLayoutSiderProps.collapsed },
    collapsible: { type: Boolean, default: defaultLayoutSiderProps.collapsible },
    placement: {
      type: String as PropType<LayoutSiderPlacement>,
      default: defaultLayoutSiderProps.placement,
    },
    breakpoint: {
      type: String as PropType<LayoutSiderBreakpoint | undefined>,
      default: defaultLayoutSiderProps.breakpoint,
    },
  },
  emits: {
    'update:collapsed': (_collapsed: boolean) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixLayoutStyles();
    let mql: MediaQueryList | null = null;
    function handleBreakpointChange(event: MediaQueryListEvent): void {
      emit('update:collapsed', event.matches);
    }

    onMounted(() => {
      if (typeof window === 'undefined') return;
      if (props.breakpoint === undefined) return;
      mql = window.matchMedia(resolveBreakpointMediaQuery(props.breakpoint));
      if (mql.matches !== props.collapsed) emit('update:collapsed', mql.matches);
      mql.addEventListener('change', handleBreakpointChange);
    });

    onBeforeUnmount(() => {
      if (mql !== null) {
        mql.removeEventListener('change', handleBreakpointChange);
        mql = null;
      }
    });

    function onTriggerClick(): void {
      emit('update:collapsed', !props.collapsed);
    }

    function renderTrigger(): VNode {
      const iconName =
        props.placement === 'left'
          ? props.collapsed
            ? 'chevron-right'
            : 'chevron-left'
          : props.collapsed
            ? 'chevron-left'
            : 'chevron-right';
      const iconSpec = getIcon(iconName);
      const iconNode = iconSpec
        ? h(
            'svg',
            {
              viewBox: iconSpec.viewBox,
              width: 16,
              height: 16,
              fill: 'currentColor',
              'aria-hidden': 'true',
            },
            iconSpec.paths.map((p) =>
              h('path', {
                d: p.d,
                ...(p.fillRule !== undefined ? { 'fill-rule': p.fillRule } : {}),
              }),
            ),
          )
        : h('span', '›');
      return h(
        'button',
        {
          type: 'button',
          class: 'cx-ui-layout__sider-trigger',
          'aria-label': props.collapsed ? 'Expand' : 'Collapse',
          onClick: onTriggerClick,
        },
        [iconNode],
      );
    }

    return () => {
      const widthStyle = resolveLayoutSiderWidthStyle({
        collapsed: props.collapsed,
        width: props.width,
        collapsedWidth: props.collapsedWidth,
      });
      const classes = resolveLayoutSiderClassList({
        collapsed: props.collapsed,
        collapsible: props.collapsible,
        placement: props.placement,
      });
      const children: VNode[] = [
        h('div', { class: 'cx-ui-layout__sider-content' }, slots['default']?.() ?? []),
      ];
      if (props.collapsible) children.push(renderTrigger());
      return h('aside', { class: classes, style: { width: widthStyle } }, children);
    };
  },
});
