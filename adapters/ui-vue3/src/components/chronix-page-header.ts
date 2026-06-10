import {
  PAGE_HEADER_BACK_ICON_PLACEHOLDER,
  defaultPageHeaderProps,
  ensureChronixPageHeaderStyles,
  resolvePageHeaderClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixPageHeader>` — Vue 3 SFC wrapping the core `PageHeaderProps`
 * IR. Phase 19 (2026-06-02). Tier A page-chrome primitive.
 *
 * Slots (all optional):
 *
 * - `back` — content of the back affordance; defaults to the unicode
 *   `←` from `PAGE_HEADER_BACK_ICON_PLACEHOLDER` when `back=true`.
 * - `avatar` — left-of-heading avatar content.
 * - `title` — overrides `props.title` string when supplied.
 * - `subtitle` — overrides `props.subtitle` string when supplied.
 * - `extra` — right-aligned action area (typically buttons).
 * - `footer` — bottom-of-header content (tabs / descriptions).
 * - `default` — main page content rendered between the heading row
 *   and the footer.
 *
 * Emits:
 *
 * - `back` — fires when the back affordance is clicked. No payload.
 */
export const ChronixPageHeader = defineComponent({
  name: 'ChronixPageHeader',
  props: {
    title: {
      type: String as PropType<string | undefined>,
      default: defaultPageHeaderProps.title,
    },
    subtitle: {
      type: String as PropType<string | undefined>,
      default: defaultPageHeaderProps.subtitle,
    },
    back: {
      type: Boolean,
      default: defaultPageHeaderProps.back,
    },
    inverted: {
      type: Boolean,
      default: defaultPageHeaderProps.inverted,
    },
  },
  emits: {
    back: () => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixPageHeaderStyles();

    const resolvedProps = computed(() => ({
      title: props.title,
      subtitle: props.subtitle,
      back: props.back,
      inverted: props.inverted,
    }));

    function handleBackClick(): void {
      emit('back');
    }

    return () => {
      const backSlot = slots['back'];
      const avatarSlot = slots['avatar'];
      const titleSlot = slots['title'];
      const subtitleSlot = slots['subtitle'];
      const extraSlot = slots['extra'];
      const footerSlot = slots['footer'];
      const defaultSlot = slots['default'];

      const avatarNodes = avatarSlot ? avatarSlot() : [];
      const titleSlotNodes = titleSlot ? titleSlot() : [];
      const subtitleSlotNodes = subtitleSlot ? subtitleSlot() : [];
      const extraNodes = extraSlot ? extraSlot() : [];
      const footerNodes = footerSlot ? footerSlot() : [];
      const defaultNodes = defaultSlot ? defaultSlot() : [];

      const hasAvatar = avatarNodes.length > 0;
      const hasTitle = titleSlotNodes.length > 0 || resolvedProps.value.title !== undefined;
      const hasSubtitle =
        subtitleSlotNodes.length > 0 || resolvedProps.value.subtitle !== undefined;
      const hasExtra = extraNodes.length > 0;
      const hasFooter = footerNodes.length > 0;
      const hasContent = defaultNodes.length > 0;

      const classList = resolvePageHeaderClassList({
        props: resolvedProps.value,
        hasTitle,
        hasSubtitle,
        hasAvatar,
        hasExtra,
        hasFooter,
        hasContent,
      });

      const mainChildren: VNode[] = [];
      if (resolvedProps.value.back) {
        const backChildren = backSlot != null ? backSlot() : [PAGE_HEADER_BACK_ICON_PLACEHOLDER];
        mainChildren.push(
          h(
            'button',
            {
              type: 'button',
              class: 'cx-ui-page-header__back-button',
              'aria-label': 'Back',
              onClick: handleBackClick,
            },
            backChildren,
          ),
        );
      }
      if (hasAvatar) {
        mainChildren.push(h('div', { class: 'cx-ui-page-header__avatar' }, avatarNodes));
      }
      const headingChildren: VNode[] = [];
      if (hasTitle) {
        const titleContent = titleSlotNodes.length > 0 ? titleSlotNodes : resolvedProps.value.title;
        headingChildren.push(h('div', { class: 'cx-ui-page-header__title' }, titleContent));
      }
      if (hasSubtitle) {
        const subtitleContent =
          subtitleSlotNodes.length > 0 ? subtitleSlotNodes : resolvedProps.value.subtitle;
        headingChildren.push(h('div', { class: 'cx-ui-page-header__subtitle' }, subtitleContent));
      }
      if (headingChildren.length > 0) {
        mainChildren.push(h('div', { class: 'cx-ui-page-header__heading' }, headingChildren));
      }
      if (hasExtra) {
        mainChildren.push(h('div', { class: 'cx-ui-page-header__extra' }, extraNodes));
      }

      const children: VNode[] = [h('div', { class: 'cx-ui-page-header__main' }, mainChildren)];
      if (hasContent) {
        children.push(h('div', { class: 'cx-ui-page-header__content' }, defaultNodes));
      }
      if (hasFooter) {
        children.push(h('div', { class: 'cx-ui-page-header__footer' }, footerNodes));
      }

      return h('div', { class: classList }, children);
    };
  },
});
