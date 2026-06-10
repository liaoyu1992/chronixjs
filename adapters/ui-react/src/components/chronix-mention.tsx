import {
  composeKeyboardSelection,
  defaultMentionProps,
  detectMultiMentionTrigger,
  ensureChronixMentionStyles,
  filterSelectOptions,
  flattenSelectOptions,
  resolveMentionDropdownClassList,
  resolveMentionEmptyClassList,
  resolveMentionOptionClassList,
  resolveMentionRootClassList,
  resolveMentionTextareaClassList,
  type MentionFilterFn,
  type MentionSource,
  type PopupPlacement,
  type SelectOption,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixMentionProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'placeholder' | 'value'
> {
  readonly value?: string;
  readonly options?: readonly SelectOption[];
  readonly trigger?: string;
  readonly placement?: PopupPlacement;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly sources?: readonly MentionSource[];
  readonly filter?: MentionFilterFn;
  readonly onChange?: (value: string) => void;
}

export function ChronixMention(props: ChronixMentionProps): JSX.Element {
  const {
    value = defaultMentionProps.value,
    options = defaultMentionProps.options,
    trigger = defaultMentionProps.trigger,
    placement = defaultMentionProps.placement,
    disabled = defaultMentionProps.disabled,
    placeholder = defaultMentionProps.placeholder,
    sources = [],
    filter,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixMentionStyles();
  }, []);

  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTrigger, setActiveTrigger] = useState(trigger);

  // Effective triggers: from sources if provided, else single trigger
  const effectiveTriggers = useMemo(
    () => (sources.length > 0 ? sources.map((s) => s.trigger) : [trigger]),
    [sources, trigger],
  );

  // Active options: from matching source if sources provided, else props.options
  const activeOptions = useMemo(() => {
    if (sources.length > 0) {
      const src = sources.find((s) => s.trigger === activeTrigger);
      return src ? src.options : [];
    }
    return options;
  }, [sources, activeTrigger, options]);

  const lifecycle = usePopupLifecycle({
    show: showDropdown,
    trigger: 'manual',
    placement,
    offset: 4,
    flip: true,
    widthMatch: false,
    disabled,
    onVisibilityChange: (next) => {
      setShowDropdown(next);
      if (!next) setFocusedKey(null);
    },
  });

  const filteredOptions = useMemo(
    () =>
      filter
        ? filter(mentionQuery, activeOptions)
        : filterSelectOptions(activeOptions, mentionQuery),
    [filter, mentionQuery, activeOptions],
  );
  const flatEntries = useMemo(() => flattenSelectOptions(filteredOptions), [filteredOptions]);
  const activatableKeys = useMemo(
    () =>
      flatEntries
        .filter((e) => !e.isGroup && !(e.option as { disabled?: boolean }).disabled)
        .map((e) => e.option.key),
    [flatEntries],
  );
  const rootClassName = useMemo(
    () => resolveMentionRootClassList({ disabled, open: lifecycle.visible }).join(' '),
    [disabled, lifecycle.visible],
  );

  const onTextareaInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.target as HTMLTextAreaElement;
      const newValue = textarea.value;
      const cursorIndex = textarea.selectionStart ?? 0;
      onChange?.(newValue);
      const result = detectMultiMentionTrigger(newValue, cursorIndex, effectiveTriggers);
      if (result !== null) {
        setMentionQuery(result.query);
        setMentionStartIndex(result.triggerStart);
        setActiveTrigger(result.matchedTrigger);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    },
    [effectiveTriggers, onChange],
  );

  const insertMention = useCallback(
    (opt: SelectOption) => {
      const leaf = opt as { value: string };
      if (!leaf.value) return;
      const current = value;
      const before = current.substring(0, mentionStartIndex);
      const after = current.substring(before.length + activeTrigger.length + mentionQuery.length);
      onChange?.(`${before}${activeTrigger}${leaf.value} ${after}`);
      setShowDropdown(false);
    },
    [value, mentionStartIndex, activeTrigger, mentionQuery, onChange],
  );

  const onDropdownKeydown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        return;
      }
      if (e.key === 'Enter' && focusedKey !== null) {
        e.preventDefault();
        const entry = flatEntries.find((e) => e.option.key === focusedKey);
        if (entry && !entry.isGroup) insertMention(entry.option);
        return;
      }
      let direction: 'up' | 'down' | null = null;
      if (e.key === 'ArrowDown') direction = 'down';
      else if (e.key === 'ArrowUp') direction = 'up';
      if (direction) {
        e.preventDefault();
        const next = composeKeyboardSelection({
          currentKey: focusedKey,
          availableKeys: activatableKeys,
          direction,
          wrap: true,
        });
        if (next !== null) setFocusedKey(next);
      }
    },
    [focusedKey, activatableKeys, flatEntries, insertMention],
  );

  // dropdown options
  const optionNodes: JSX.Element[] = [];
  if (flatEntries.length === 0) {
    optionNodes.push(
      <div key="empty" className={resolveMentionEmptyClassList().join(' ')}>
        No results
      </div>,
    );
  } else {
    for (const entry of flatEntries) {
      if (entry.isGroup) continue;
      const opt = entry.option;
      const isFocused = focusedKey === opt.key;
      const isDisabled = !!(opt as { disabled?: boolean }).disabled;
      optionNodes.push(
        <div
          key={opt.key}
          className={resolveMentionOptionClassList(false, isFocused, isDisabled).join(' ')}
          data-testid={`mention-option-${opt.key}`}
          onMouseDown={(e) => {
            e.preventDefault();
            if (!isDisabled) insertMention(opt);
          }}
          onMouseEnter={() => setFocusedKey(opt.key)}
        >
          {opt.label}
        </div>,
      );
    }
  }

  const portal =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={resolveMentionDropdownClassList().join(' ')}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
            data-testid="mention-dropdown-popup"
          >
            {optionNodes}
          </div>,
          lifecycle.portalTarget,
        )
      : null;

  return (
    <div
      {...rest}
      ref={lifecycle.triggerRef as React.RefObject<HTMLDivElement>}
      className={rootClassName}
      data-testid={((rest as Record<string, unknown>)['data-testid'] as string) ?? 'mention-root'}
    >
      <textarea
        className={resolveMentionTextareaClassList().join(' ')}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        data-testid="mention-textarea"
        onInput={onTextareaInput}
        onKeyDown={(e) => {
          if (lifecycle.visible) onDropdownKeydown(e);
        }}
      />
      {portal}
    </div>
  );
}
