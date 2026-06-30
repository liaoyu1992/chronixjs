import {
  type NotificationItem,
  type NotificationType,
  createNotificationItemId,
  ensureChronixNotificationStyles,
} from '@chronixjs/ui';
import { ref, type Ref } from 'vue';

/**
 * Vue 2.7 imperative Notification queue composable — .
 * Verbatim port of `adapters/ui-vue3`'s `useNotification()`.
 *
 * Usage:
 * ```ts
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
  readonly items: Ref<readonly NotificationItem[]>;
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

  const items = ref<NotificationItem[]>([]) as Ref<NotificationItem[]>;

  function removeItem(id: string): void {
    const idx = items.value.findIndex((item) => item.id === id);
    if (idx !== -1) {
      items.value.splice(idx, 1);
    }
  }

  function create(options: NotificationCreateOptions): string {
    const duration = options.duration ?? DEFAULT_DURATION;
    const item: NotificationItem = {
      id: createNotificationItemId(),
      title: options.title,
      description: options.description,
      type: options.type ?? 'info',
      duration,
      closable: options.closable ?? true,
    };

    items.value.push(item);

    // Auto-remove after duration (0 = persistent).
    if (duration > 0) {
      setTimeout(() => removeItem(item.id), duration);
    }

    return item.id;
  }

  function info(options: Omit<NotificationCreateOptions, 'type'>): string {
    return create({ ...options, type: 'info' });
  }

  function success(options: Omit<NotificationCreateOptions, 'type'>): string {
    return create({ ...options, type: 'success' });
  }

  function warning(options: Omit<NotificationCreateOptions, 'type'>): string {
    return create({ ...options, type: 'warning' });
  }

  function error(options: Omit<NotificationCreateOptions, 'type'>): string {
    return create({ ...options, type: 'error' });
  }

  function destroyAll(): void {
    items.value.splice(0, items.value.length);
  }

  return {
    items: items,
    create,
    info,
    success,
    warning,
    error,
    destroyAll,
  };
}
