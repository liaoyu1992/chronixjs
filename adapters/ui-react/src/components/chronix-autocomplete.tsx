import {
  defaultAutoCompleteProps,
  ensureChronixAutoCompleteStyles,
  filterAutoCompleteOptions,
  resolveAutoCompleteClassList,
  type AutoCompleteOption,
  type AutoCompleteSize,
} from '@chronixjs/ui';
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';

export interface ChronixAutoCompleteProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onSelect'
> {
  readonly value?: string;
  readonly options?: readonly AutoCompleteOption[];
  readonly placeholder?: string | undefined;
  readonly disabled?: boolean;
  readonly size?: AutoCompleteSize;
  readonly error?: string | undefined;
  readonly onChange?: (value: string) => void;
  readonly onSelect?: (option: AutoCompleteOption) => void;
}

export function ChronixAutoComplete(props: ChronixAutoCompleteProps): React.ReactElement {
  const {
    value = defaultAutoCompleteProps.value,
    options = defaultAutoCompleteProps.options,
    placeholder = defaultAutoCompleteProps.placeholder,
    disabled = defaultAutoCompleteProps.disabled,
    size = defaultAutoCompleteProps.size,
    error = defaultAutoCompleteProps.error,
    onChange,
    onSelect,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixAutoCompleteStyles();
  }, []);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => filterAutoCompleteOptions(options, value), [options, value]);
  const isOpen = open && filtered.length > 0;
  const className = useMemo(
    () =>
      resolveAutoCompleteClassList({
        props: { value, options, placeholder, disabled, size, error },
        open: isOpen,
      }).join(' '),
    [isOpen, size, disabled, error],
  );

  function selectOption(option: AutoCompleteOption) {
    onChange?.(option.value);
    onSelect?.(option);
    setOpen(false);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event.target.value);
    setOpen(true);
    setActiveIndex(0);
  }

  function onFocus() {
    setOpen(true);
  }

  function onBlur() {
    setTimeout(() => setOpen(false), 100);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (filtered.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) selectOption(opt);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  function onOptionMouseDown(event: ReactMouseEvent<HTMLLIElement>, option: AutoCompleteOption) {
    event.preventDefault();
    selectOption(option);
  }

  return (
    <div {...rest} className={className}>
      <input
        className="cx-ui-autocomplete__input"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onInputChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {isOpen && (
        <ul className="cx-ui-autocomplete__list">
          {filtered.map((opt, i) => (
            <li
              key={opt.key}
              className={
                'cx-ui-autocomplete__option' +
                (i === activeIndex ? ' cx-ui-autocomplete__option--active' : '')
              }
              onMouseDown={(e) => onOptionMouseDown(e, opt)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {error !== undefined && <span className="cx-ui-autocomplete__error">{error}</span>}
    </div>
  );
}
