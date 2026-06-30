import {
  type DialogItem,
  type DialogType,
  createDialogItemId,
  ensureChronixDiscreteDialogStyles,
} from '@chronixjs/ui';
import { ref, type Ref } from 'vue';

/**
 * Vue 3 imperative Discrete Dialog composable — .
 *
 * Manages a reactive list of `DialogItem`s. Dialogs are persistent (no
 * auto-dismiss); they are removed via user action or `destroyAll()`.
 *
 * Usage:
 * ```ts
 * const dialog = useDiscreteDialog();
 * dialog.warning({ title: 'Confirm', content: 'Proceed?' });
 * ```
 */

export interface DialogCreateOptions {
  readonly title?: string;
  readonly content: string;
  readonly type?: DialogType;
  readonly positiveText?: string;
  readonly negativeText?: string;
  readonly closable?: boolean;
}

export interface DiscreteDialogApi {
  readonly items: Ref<readonly DialogItem[]>;
  create(options: DialogCreateOptions): string;
  info(options: Omit<DialogCreateOptions, 'type'>): string;
  success(options: Omit<DialogCreateOptions, 'type'>): string;
  warning(options: Omit<DialogCreateOptions, 'type'>): string;
  error(options: Omit<DialogCreateOptions, 'type'>): string;
  destroy(id: string): void;
  destroyAll(): void;
}

export function useDiscreteDialog(): DiscreteDialogApi {
  ensureChronixDiscreteDialogStyles();

  const items = ref<DialogItem[]>([]) as Ref<DialogItem[]>;

  function destroy(id: string): void {
    const idx = items.value.findIndex((item) => item.id === id);
    if (idx !== -1) {
      items.value.splice(idx, 1);
    }
  }

  function create(options: DialogCreateOptions): string {
    const item: DialogItem = {
      id: createDialogItemId(),
      title: options.title,
      content: options.content,
      type: options.type ?? 'default',
      positiveText: options.positiveText,
      negativeText: options.negativeText,
      closable: options.closable ?? true,
    };

    items.value.push(item);
    return item.id;
  }

  function info(options: Omit<DialogCreateOptions, 'type'>): string {
    return create({ ...options, type: 'info' });
  }

  function success(options: Omit<DialogCreateOptions, 'type'>): string {
    return create({ ...options, type: 'success' });
  }

  function warning(options: Omit<DialogCreateOptions, 'type'>): string {
    return create({ ...options, type: 'warning' });
  }

  function error(options: Omit<DialogCreateOptions, 'type'>): string {
    return create({ ...options, type: 'error' });
  }

  function destroyAll(): void {
    items.value.splice(0, items.value.length);
  }

  return {
    items,
    create,
    info,
    success,
    warning,
    error,
    destroy,
    destroyAll,
  };
}
