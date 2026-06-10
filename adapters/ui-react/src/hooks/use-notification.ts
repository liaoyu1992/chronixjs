import {
  type NotificationItem,
  type NotificationType,
  createNotificationItemId,
  ensureChronixNotificationStyles,
} from '@chronixjs/ui';
import { useCallback, useRef, useState } from 'react';

/**
 * React imperative Notification queue hook — Phase 36 (2026-06-05).
 * Same surface as Vue 3 / Vue 2 `useNotification()` composables.
 *
 * Usage:
 * ```tsx
 * const notification = useNotification();
 * notification.success({ title: 'Done', description: 'Saved.' });
 * ```
 */

export interface NotificationCreateOptions {
  readonly title: string;
  readonly description?: string;
  readonly type?: NotificationType;
  readonly duration?: number;
  readonly closable?: boolean;
}

export interface NotificationApi {
  readonly items: readonly NotificationItem[];
  create(options: NotificationCreateOptions): string;
  info(options: Omit<NotificationCreateOptions, 'type'>): string;
  success(options: Omit<NotificationCreateOptions, 'type'>): string;
  warning(options: Omit<NotificationCreateOptions, 'type'>): string;
  error(options: Omit<NotificationCreateOptions, 'type'>): string;
  destroyAll(): void;
}

const DEFAULT_DURATION = 4500;

export function useNotification(): NotificationApi {
  ensureChronixNotificationStyles();

  const [items, setItems] = useState<readonly NotificationItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx === -1) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
    timersRef.current.delete(id);
  }, []);

  const create = useCallback(
    (options: NotificationCreateOptions): string => {
      const duration = options.duration ?? DEFAULT_DURATION;
      const item: NotificationItem = {
        id: createNotificationItemId(),
        title: options.title,
        description: options.description,
        type: options.type ?? 'info',
        duration,
        closable: options.closable ?? true,
      };

      setItems((prev) => [...prev, item]);

      // Auto-remove after duration (0 = persistent).
      if (duration > 0) {
        const timer = setTimeout(() => removeItem(item.id), duration);
        timersRef.current.set(item.id, timer);
      }

      return item.id;
    },
    [removeItem],
  );

  const info = useCallback(
    (options: Omit<NotificationCreateOptions, 'type'>): string => {
      return create({ ...options, type: 'info' });
    },
    [create],
  );

  const success = useCallback(
    (options: Omit<NotificationCreateOptions, 'type'>): string => {
      return create({ ...options, type: 'success' });
    },
    [create],
  );

  const warning = useCallback(
    (options: Omit<NotificationCreateOptions, 'type'>): string => {
      return create({ ...options, type: 'warning' });
    },
    [create],
  );

  const error = useCallback(
    (options: Omit<NotificationCreateOptions, 'type'>): string => {
      return create({ ...options, type: 'error' });
    },
    [create],
  );

  const destroyAll = useCallback(() => {
    setItems([]);
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
  }, []);

  return { items, create, info, success, warning, error, destroyAll };
}
