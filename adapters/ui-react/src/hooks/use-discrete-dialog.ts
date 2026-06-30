import {
  type DialogItem,
  type DialogType,
  createDialogItemId,
  ensureChronixDiscreteDialogStyles,
} from '@chronixjs/ui';
import { useCallback, useState } from 'react';

/**
 * React imperative Discrete Dialog hook — .
 * Same surface as Vue 3 / Vue 2 `useDiscreteDialog()` composables.
 * Dialogs are persistent (no auto-dismiss).
 *
 * Usage:
 * ```tsx
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
  readonly items: readonly DialogItem[];
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

  const [items, setItems] = useState<readonly DialogItem[]>([]);

  const destroy = useCallback((id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx === -1) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const create = useCallback((options: DialogCreateOptions): string => {
    const item: DialogItem = {
      id: createDialogItemId(),
      title: options.title,
      content: options.content,
      type: options.type ?? 'default',
      positiveText: options.positiveText,
      negativeText: options.negativeText,
      closable: options.closable ?? true,
    };

    setItems((prev) => [...prev, item]);
    return item.id;
  }, []);

  const info = useCallback(
    (options: Omit<DialogCreateOptions, 'type'>): string => {
      return create({ ...options, type: 'info' });
    },
    [create],
  );

  const success = useCallback(
    (options: Omit<DialogCreateOptions, 'type'>): string => {
      return create({ ...options, type: 'success' });
    },
    [create],
  );

  const warning = useCallback(
    (options: Omit<DialogCreateOptions, 'type'>): string => {
      return create({ ...options, type: 'warning' });
    },
    [create],
  );

  const error = useCallback(
    (options: Omit<DialogCreateOptions, 'type'>): string => {
      return create({ ...options, type: 'error' });
    },
    [create],
  );

  const destroyAll = useCallback(() => {
    setItems([]);
  }, []);

  return { items, create, info, success, warning, error, destroy, destroyAll };
}
