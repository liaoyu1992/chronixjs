import {
  defaultTransferProps,
  ensureChronixTransferStyles,
  computeTransferLists,
  filterTransferOptions,
  resolveTransferRootClassList,
  resolveTransferPanelClassList,
  resolveTransferItemClassList,
  type TransferOption,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType } from 'vue';

/**
 * `<ChronixTransfer>` — Vue 2 transfer with source/target panels + actions.
 * Phase 33 (2026-06-05).
 */
export const ChronixTransfer = defineComponent({
  name: 'ChronixTransfer',
  inheritAttrs: false,
  props: {
    value: { type: Array as PropType<readonly (string | number)[]>, default: () => [] },
    options: { type: Array as PropType<readonly TransferOption[]>, default: () => [] },
    disabled: { type: Boolean, default: defaultTransferProps.disabled },
    filterable: { type: Boolean, default: defaultTransferProps.filterable },
    sourceTitle: { type: String, default: defaultTransferProps.sourceTitle },
    targetTitle: { type: String, default: defaultTransferProps.targetTitle },
  },
  emits: {
    'update:value': (_value: (string | number)[]) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixTransferStyles();
    const sourceChecked = ref<Set<string | number>>(new Set());
    const targetChecked = ref<Set<string | number>>(new Set());
    const sourceFilter = ref('');
    const targetFilter = ref('');

    const lists = computed(() => computeTransferLists(props.options, props.value));
    const filteredSource = computed(() =>
      filterTransferOptions(lists.value.source, sourceFilter.value),
    );
    const filteredTarget = computed(() =>
      filterTransferOptions(lists.value.target, targetFilter.value),
    );

    const rootClass = computed(() =>
      resolveTransferRootClassList({ disabled: props.disabled }).join(' '),
    );

    function toggleSourceCheck(value: string | number): void {
      const next = new Set(sourceChecked.value);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      sourceChecked.value = next;
    }

    function toggleTargetCheck(value: string | number): void {
      const next = new Set(targetChecked.value);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      targetChecked.value = next;
    }

    function moveToTarget(): void {
      const newValue = [...props.value, ...sourceChecked.value];
      sourceChecked.value = new Set();
      emit('update:value', newValue);
    }

    function moveToSource(): void {
      const removeSet = new Set(targetChecked.value);
      const newValue = props.value.filter((v) => !removeSet.has(v));
      targetChecked.value = new Set();
      emit('update:value', newValue);
    }

    function renderPanel(
      position: 'source' | 'target',
      title: string,
      items: readonly TransferOption[],
      checked: Set<string | number>,
      filterValue: string,
      toggleCheck: (v: string | number) => void,
    ) {
      const headerChildren: ReturnType<typeof h>[] = [
        h('span', { class: 'cx-ui-transfer__header-title' }, title),
        h('span', { class: 'cx-ui-transfer__header-count' }, `${checked.size}/${items.length}`),
      ];

      const panelChildren: ReturnType<typeof h>[] = [
        // Header
        h('div', { class: 'cx-ui-transfer__header' }, headerChildren),
      ];

      // Filter
      if (props.filterable) {
        panelChildren.push(
          h('div', { class: 'cx-ui-transfer__filter' }, [
            h('input', {
              class: 'cx-ui-transfer__filter-input',
              domProps: { value: filterValue },
              attrs: { placeholder: 'Search...' },
              on: {
                input: (e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  if (position === 'source') sourceFilter.value = v;
                  else targetFilter.value = v;
                },
              },
            }),
          ]),
        );
      }

      // Body
      const bodyChildren: ReturnType<typeof h>[] =
        items.length === 0
          ? [h('div', { class: 'cx-ui-transfer__empty' }, 'No data')]
          : items.map((opt) =>
              h(
                'div',
                {
                  key: opt.value,
                  class: resolveTransferItemClassList({
                    checked: checked.has(opt.value),
                    disabled: opt.disabled ?? false,
                  }).join(' '),
                  attrs: { 'data-testid': `transfer-item-${opt.value}` },
                  on: {
                    click: () => {
                      if (!props.disabled && !opt.disabled) toggleCheck(opt.value);
                    },
                  },
                },
                [
                  h('input', {
                    class: 'cx-ui-transfer__item-checkbox',
                    domProps: { checked: checked.has(opt.value) },
                    attrs: { type: 'checkbox', disabled: opt.disabled ?? false },
                  }),
                  h('span', { class: 'cx-ui-transfer__item-label' }, opt.label),
                ],
              ),
            );

      panelChildren.push(h('div', { class: 'cx-ui-transfer__body' }, bodyChildren));

      return h(
        'div',
        {
          class: resolveTransferPanelClassList({ position }).join(' '),
          attrs: { 'data-testid': `transfer-${position}` },
        },
        panelChildren,
      );
    }

    return () =>
      h(
        'div',
        {
          class: rootClass.value,
          attrs: {
            ...((attrs as Record<string, unknown>)['data-testid'] != null
              ? { 'data-testid': (attrs as Record<string, unknown>)['data-testid'] as string }
              : { 'data-testid': 'transfer-root' }),
          },
        },
        [
          renderPanel(
            'source',
            props.sourceTitle,
            filteredSource.value,
            sourceChecked.value,
            sourceFilter.value,
            toggleSourceCheck,
          ),
          // Actions
          h('div', { class: 'cx-ui-transfer__actions' }, [
            h(
              'button',
              {
                class: 'cx-ui-transfer__action-btn',
                attrs: {
                  disabled: sourceChecked.value.size === 0 || undefined,
                  'data-testid': 'transfer-to-target',
                },
                on: { click: moveToTarget },
              },
              '→',
            ),
            h(
              'button',
              {
                class: 'cx-ui-transfer__action-btn',
                attrs: {
                  disabled: targetChecked.value.size === 0 || undefined,
                  'data-testid': 'transfer-to-source',
                },
                on: { click: moveToSource },
              },
              '←',
            ),
          ]),
          renderPanel(
            'target',
            props.targetTitle,
            filteredTarget.value,
            targetChecked.value,
            targetFilter.value,
            toggleTargetCheck,
          ),
        ],
      );
  },
});
