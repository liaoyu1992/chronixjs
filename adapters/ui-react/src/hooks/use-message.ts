import {
  type MessageItem,
  type MessageType,
  type MessageQueueOptions,
  createMessageItemId,
  ensureChronixMessageStyles,
} from '@chronixjs/ui';
import { useCallback, useRef, useState } from 'react';

/**
 * React imperative Message queue hook — .
 * Same surface as Vue 3 / Vue 2 `useMessage()` composables.
 *
 * Usage:
 * ```tsx
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
  readonly items: readonly MessageItem[];
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

  const [items, setItems] = useState<readonly MessageItem[]>([]);
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
    (options: MessageCreateOptions): string => {
      const duration = options.duration ?? queueOptions?.duration ?? DEFAULT_DURATION;
      const item: MessageItem = {
        id: createMessageItemId(),
        content: options.content,
        type: options.type ?? 'info',
        duration,
        closable: options.closable ?? false,
      };

      setItems((prev) => {
        const max = queueOptions?.max;
        const next = prev.slice();
        if (max !== undefined && next.length >= max) {
          next.splice(0, next.length - max + 1);
        }
        next.push(item);
        return next;
      });

      // Auto-remove after duration (0 = persistent).
      if (duration > 0) {
        const timer = setTimeout(() => removeItem(item.id), duration);
        timersRef.current.set(item.id, timer);
      }

      return item.id;
    },
    [queueOptions, removeItem],
  );

  const info = useCallback(
    (content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string => {
      return create({ ...options, content, type: 'info' });
    },
    [create],
  );

  const success = useCallback(
    (content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string => {
      return create({ ...options, content, type: 'success' });
    },
    [create],
  );

  const warning = useCallback(
    (content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string => {
      return create({ ...options, content, type: 'warning' });
    },
    [create],
  );

  const error = useCallback(
    (content: string, options?: Omit<MessageCreateOptions, 'content' | 'type'>): string => {
      return create({ ...options, content, type: 'error' });
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
