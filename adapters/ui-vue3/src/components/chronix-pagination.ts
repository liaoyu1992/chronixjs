import {
  defaultPaginationProps,
  ensureChronixPaginationStyles,
  computePaginationPages,
  resolvePaginationRootClassList,
  resolvePaginationItemClassList,
  resolvePaginationButtonClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref } from 'vue';

export const ChronixPagination = defineComponent({
  name: 'ChronixPagination',
  inheritAttrs: false,
  props: {
    page: { type: Number, default: defaultPaginationProps.page },
    pageCount: { type: Number, default: defaultPaginationProps.pageCount },
    disabled: { type: Boolean, default: defaultPaginationProps.disabled },
    pageSlot: { type: Number, default: defaultPaginationProps.pageSlot },
    showQuickJumper: { type: Boolean, default: defaultPaginationProps.showQuickJumper },
  },
  emits: {
    'update:page': (_page: number) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixPaginationStyles();
    const jumperInput = ref('');

    const rootClass = computed(() =>
      resolvePaginationRootClassList({ disabled: props.disabled }).join(' '),
    );

    const pages = computed(() =>
      computePaginationPages(props.page, props.pageCount, props.pageSlot),
    );

    function goToPage(p: number): void {
      if (p < 1 || p > props.pageCount || props.disabled) return;
      emit('update:page', p);
    }

    function handleJumper(): void {
      const p = parseInt(jumperInput.value, 10);
      if (!isNaN(p)) goToPage(p);
      jumperInput.value = '';
    }

    return () =>
      h('div', { class: rootClass.value, ...attrs, 'data-testid': 'pagination-root' }, [
        // Prev button
        h(
          'button',
          {
            class: resolvePaginationButtonClassList({
              disabled: props.page <= 1 || props.disabled,
            }).join(' '),
            'data-testid': 'pagination-prev',
            onClick: () => goToPage(props.page - 1),
          },
          '‹',
        ),
        // Page items
        ...pages.value.map((p, i) =>
          p === null
            ? h('span', { key: `ellipsis-${i}`, class: 'cx-ui-pagination__ellipsis' }, '…')
            : h(
                'button',
                {
                  key: p,
                  class: resolvePaginationItemClassList({
                    active: p === props.page,
                    disabled: props.disabled,
                  }).join(' '),
                  'data-testid': `pagination-page-${p}`,
                  onClick: () => goToPage(p),
                },
                String(p),
              ),
        ),
        // Next button
        h(
          'button',
          {
            class: resolvePaginationButtonClassList({
              disabled: props.page >= props.pageCount || props.disabled,
            }).join(' '),
            'data-testid': 'pagination-next',
            onClick: () => goToPage(props.page + 1),
          },
          '›',
        ),
        // Quick jumper
        props.showQuickJumper
          ? h('div', { class: 'cx-ui-pagination__jumper' }, [
              h('span', {}, 'Go to'),
              h('input', {
                class: 'cx-ui-pagination__jumper-input',
                value: jumperInput.value,
                'data-testid': 'pagination-jumper',
                onInput: (e: Event) => {
                  jumperInput.value = (e.target as HTMLInputElement).value;
                },
                onKeydown: (e: KeyboardEvent) => {
                  if (e.key === 'Enter') handleJumper();
                },
              }),
            ])
          : null,
      ]);
  },
});
