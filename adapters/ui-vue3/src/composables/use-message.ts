import {
  type MessageItem,
  type MessageType,
  type MessageQueueOptions,
  createMessageItemId,
  ensureChronixMessageStyles,
} from '@chronixjs/ui';
import { ref, type Ref } from 'vue';

/**
 * Vue 3 imperative Message queue composable — Phase 36 (2026-06-05).
 *
 * Manages a reactive list of `MessageItem`s and exposes an API with
 * `create()`, `info()`, `success()`, `warning()`, `error()`, and
 * `destroyAll()`. Items auto-remove after `duration` ms (default 3000).
 *
 * Usage:
 * ```ts
 * const message = useMessage();
 * message.success('Saved!');
 * ```
 */

export interface MessageCreateOptions {
  readonly content: string;
  readonly type?: MessageType;
  readonly duration?: number;
  readonly closable?: boolean;
}

export interface MessageApi {
  readonly items: Ref<readonly MessageItem[]>;
  create(options: MessageCreateOptions): string;
  info(content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string;
  success(content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string;
  warning(content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string;
  error(content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string;
  destroyAll(): void;
}

const DEFAULT_DURATION = 3000;

export function useMessage(queueOptions?: MessageQueueOptions): MessageApi {
  ensureChronixMessageStyles();

  const items = ref<MessageItem[]>([]) as Ref<MessageItem[]>;

  function removeItem(id: string): void {
    const idx = items.value.findIndex((item) => item.id === id);
    if (idx !== -1) {
      items.value.splice(idx, 1);
    }
  }

  function create(options: MessageCreateOptions): string {
    const duration = options.duration ?? queueOptions?.duration ?? DEFAULT_DURATION;
    const item: MessageItem = {
      id: createMessageItemId(),
      content: options.content,
      type: options.type ?? 'info',
      duration,
      closable: options.closable ?? false,
    };

    // Enforce max visible items.
    const max = queueOptions?.max;
    if (max !== undefined && items.value.length >= max) {
      items.value.splice(0, items.value.length - max + 1);
    }

    items.value.push(item);

    // Auto-remove after duration (0 = persistent).
    if (duration > 0) {
      setTimeout(() => removeItem(item.id), duration);
    }

    return item.id;
  }

  function info(content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string {
    return create({ ...options, content, type: 'info' });
  }

  function success(
    content: string,
    options?: Omit<MessageCreateOptions, 'content' | 'type'>,
  ): string {
    return create({ ...options, content, type: 'success' });
  }

  function warning(
    content: string,
    options?: Omit<MessageCreateOptions, 'content' | 'type'>,
  ): string {
    return create({ ...options, content, type: 'warning' });
  }

  function error(
    content: string,
    options?: Omit<MessageCreateOptions, 'content' | 'type'>,
  ): string {
    return create({ ...options, content, type: 'error' });
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
    destroyAll,
  };
}
