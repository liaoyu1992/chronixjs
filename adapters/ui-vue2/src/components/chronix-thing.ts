import { defaultThingProps, ensureChronixThingStyles, resolveThingClassList } from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixThing>` — Vue 2.7 port of the Phase 23 Thing.
 *
 * DOM shape + class list byte-identical to vue3 sibling.
 * Slot names + prop-or-slot resolution semantics match exactly
 * (`hasHeader = headerSlotNodes.length > 0 || props.title !==
 * undefined`).
 */
export const ChronixThing = defineComponent({
  name: 'ChronixThing',
  props: {
    title: {
      type: String as PropType<string | undefined>,
      default: defaultThingProps.title,
    },
    description: {
      type: String as PropType<string | undefined>,
      default: defaultThingProps.description,
    },
    contentIndented: {
      type: Boolean,
      default: defaultThingProps.contentIndented,
    },
  },
  setup(props, { slots }) {
    ensureChronixThingStyles();

    const resolvedProps = computed(() => ({
      title: props.title,
      description: props.description,
      contentIndented: props.contentIndented,
    }));

    return () => {
      const avatarSlot = slots['avatar'];
      const headerSlot = slots['header'];
      const headerExtraSlot = slots['header-extra'];
      const descriptionSlot = slots['description'];
      const actionSlot = slots['action'];
      const footerSlot = slots['footer'];
      const defaultSlot = slots['default'];

      const avatarNodes = avatarSlot ? avatarSlot() : [];
      const headerSlotNodes = headerSlot ? headerSlot() : [];
      const headerExtraNodes = headerExtraSlot ? headerExtraSlot() : [];
      const descriptionSlotNodes = descriptionSlot ? descriptionSlot() : [];
      const actionNodes = actionSlot ? actionSlot() : [];
      const footerNodes = footerSlot ? footerSlot() : [];
      const defaultNodes = defaultSlot ? defaultSlot() : [];

      const hasAvatar = avatarNodes.length > 0;
      const hasHeader = headerSlotNodes.length > 0 || resolvedProps.value.title !== undefined;
      const hasHeaderExtra = headerExtraNodes.length > 0;
      const hasDescription =
        descriptionSlotNodes.length > 0 || resolvedProps.value.description !== undefined;
      const hasAction = actionNodes.length > 0;
      const hasFooter = footerNodes.length > 0;
      const hasContent = defaultNodes.length > 0;

      const classList = resolveThingClassList({
        props: resolvedProps.value,
        hasAvatar,
        hasHeader,
        hasHeaderExtra,
        hasDescription,
        hasContent,
        hasAction,
        hasFooter,
      });

      const children: VNode[] = [];
      if (hasAvatar) {
        children.push(h('div', { class: 'cx-ui-thing__avatar' }, avatarNodes));
      }

      const mainChildren: VNode[] = [];

      if (hasHeader || hasHeaderExtra) {
        const headerChildren: VNode[] = [];
        if (hasHeader) {
          const headerContent =
            headerSlotNodes.length > 0 ? headerSlotNodes : resolvedProps.value.title;
          headerChildren.push(h('div', { class: 'cx-ui-thing__header-content' }, headerContent));
        }
        if (hasHeaderExtra) {
          headerChildren.push(h('div', { class: 'cx-ui-thing__header-extra' }, headerExtraNodes));
        }
        mainChildren.push(h('div', { class: 'cx-ui-thing__header' }, headerChildren));
      }

      if (hasDescription) {
        const descriptionContent =
          descriptionSlotNodes.length > 0 ? descriptionSlotNodes : resolvedProps.value.description;
        mainChildren.push(h('div', { class: 'cx-ui-thing__description' }, descriptionContent));
      }

      if (hasContent) {
        mainChildren.push(h('div', { class: 'cx-ui-thing__content' }, defaultNodes));
      }

      if (hasAction) {
        mainChildren.push(h('div', { class: 'cx-ui-thing__action' }, actionNodes));
      }

      if (hasFooter) {
        mainChildren.push(h('div', { class: 'cx-ui-thing__footer' }, footerNodes));
      }

      children.push(h('div', { class: 'cx-ui-thing__main' }, mainChildren));

      return h('div', { class: classList }, children);
    };
  },
});
