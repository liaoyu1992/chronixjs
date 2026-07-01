/**
 * chronix-ui React ChronixForm + ChronixFormItem — .
 *
 * React adapter for ChronixForm + ChronixFormItem. Uses Context for
 * Form→FormItem registration. React differences from Vue:
 * - `useState` for reactive state
 * - `useEffect` for mount/unmount lifecycle
 * - `useRef` + `useCallback` for stable references
 * - Props interface extends `HTMLAttributes`
 */

import {
  defaultFormProps,
  ensureChronixFormStyles,
  getNestedValue,
  isFieldRequired,
  resolveFormBlankClassList,
  resolveFormClassList,
  resolveFormFeedbackClassList,
  resolveFormItemClassList,
  resolveFormLabelClassList,
  validateField,
  type FieldError,
  type FormLabelAlign,
  type FormLabelPlacement,
  type FormSize,
  type ValidationRule,
} from '@chronixjs/ui';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

import { useUIContext } from '../hooks/use-ui-context.js';

// ---------------------------------------------------------------------------
// FormItem registration API
// ---------------------------------------------------------------------------

export interface FormItemApi {
  readonly path: string | undefined;
  validate(trigger?: string): Promise<readonly FieldError[]>;
  restoreValidation(): void;
}

interface FormRegistrationContext {
  readonly rules: Readonly<Record<string, ValidationRule | readonly ValidationRule[]>>;
  readonly model: Record<string, unknown>;
  readonly showFeedback: boolean;
  readonly showRequireMark: boolean | undefined;
  readonly labelPlacement: FormLabelPlacement;
  readonly labelWidth: number | string | undefined;
  readonly labelAlign: FormLabelAlign;
  readonly size: FormSize;
  readonly disabled: boolean;
  registerItem(api: FormItemApi): void;
  unregisterItem(api: FormItemApi): void;
}

const FormContext = createContext<FormRegistrationContext | null>(null);

// ---------------------------------------------------------------------------
// ChronixForm
// ---------------------------------------------------------------------------

export interface ChronixFormProps extends Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'children' | 'onChange' | 'onSubmit'
> {
  readonly model?: Record<string, unknown>;
  readonly rules?: Readonly<Record<string, ValidationRule | readonly ValidationRule[]>>;
  readonly labelPlacement?: FormLabelPlacement;
  readonly labelWidth?: number | string;
  readonly labelAlign?: FormLabelAlign;
  readonly inline?: boolean;
  readonly size?: FormSize;
  readonly disabled?: boolean | undefined;
  readonly showFeedback?: boolean;
  readonly showRequireMark?: boolean | undefined;
  readonly preventSubmit?: boolean;
  readonly children?: ReactNode;
  readonly onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function ChronixForm(props: ChronixFormProps): React.ReactElement {
  const {
    model = {},
    rules = {},
    labelPlacement = defaultFormProps.labelPlacement,
    labelWidth = undefined,
    labelAlign = defaultFormProps.labelAlign,
    inline = defaultFormProps.inline,
    size: sizeProp,
    disabled: disabledProp,
    showFeedback = defaultFormProps.showFeedback,
    showRequireMark = defaultFormProps.showRequireMark,
    preventSubmit = defaultFormProps.preventSubmit,
    children,
    onSubmit,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixFormStyles();
  }, []);

  const ctx = useUIContext();
  const resolvedSize = sizeProp ?? ctx.size;
  const resolvedDisabled = disabledProp ?? ctx.disabled;

  const itemsRef = useRef(new Set<FormItemApi>());

  const registerItem = useCallback((api: FormItemApi) => {
    itemsRef.current.add(api);
  }, []);

  const unregisterItem = useCallback((api: FormItemApi) => {
    itemsRef.current.delete(api);
  }, []);

  const formCtx = useMemo<FormRegistrationContext>(
    () => ({
      rules,
      model,
      showFeedback: showFeedback ?? true,
      showRequireMark: showRequireMark,
      labelPlacement: labelPlacement ?? defaultFormProps.labelPlacement!,
      labelWidth,
      labelAlign: labelAlign ?? defaultFormProps.labelAlign!,
      size: resolvedSize,
      disabled: resolvedDisabled ?? false,
      registerItem,
      unregisterItem,
    }),
    [
      rules,
      model,
      showFeedback,
      showRequireMark,
      labelPlacement,
      labelWidth,
      labelAlign,
      resolvedSize,
      resolvedDisabled,
      registerItem,
      unregisterItem,
    ],
  );

  const rootClassName = useMemo(
    () =>
      resolveFormClassList({
        inline: inline ?? false,
        labelPlacement: labelPlacement ?? 'top',
      }).join(' '),
    [inline, labelPlacement],
  );

  const rootStyle = useMemo<CSSProperties>(() => {
    if (labelWidth === undefined) return {};
    const w = typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth;
    return { '--cx-ui-form-label-width': w } as CSSProperties;
  }, [labelWidth]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (preventSubmit) e.preventDefault();
      onSubmit?.(e);
    },
    [preventSubmit, onSubmit],
  );

  return (
    <FormContext.Provider value={formCtx}>
      <form
        data-testid="form-root"
        {...rest}
        className={rootClassName}
        style={rootStyle}
        onSubmit={handleSubmit}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// ChronixFormItem
// ---------------------------------------------------------------------------

export interface ChronixFormItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly label?: string;
  readonly path?: string;
  readonly rule?: ValidationRule | readonly ValidationRule[];
  readonly showFeedback?: boolean | undefined;
  readonly required?: boolean | undefined;
  readonly labelWidth?: number | string;
  readonly labelAlign?: FormLabelAlign;
  readonly labelPlacement?: FormLabelPlacement;
  readonly size?: FormSize;
  readonly children?: ReactNode;
}

export function ChronixFormItem(props: ChronixFormItemProps): React.ReactElement {
  const {
    label,
    path,
    rule,
    showFeedback: showFeedbackProp,
    required: requiredProp,
    labelWidth: labelWidthProp,
    labelAlign: labelAlignProp,
    labelPlacement: labelPlacementProp,
    size: sizeProp,
    children,
    ...rest
  } = props;

  const formCtx = useContext(FormContext);

  const [errors, setErrors] = useState<readonly FieldError[]>([]);
  const [_validating, setValidating] = useState(false);

  const resolvedRules = useMemo((): ValidationRule | readonly ValidationRule[] | undefined => {
    if (rule !== undefined) return rule;
    if (!path || !formCtx) return undefined;
    return formCtx.rules[path];
  }, [rule, path, formCtx]);

  const resolvedSize = sizeProp ?? formCtx?.size ?? 'medium';
  const resolvedLabelPlacement = labelPlacementProp ?? formCtx?.labelPlacement ?? 'top';
  const resolvedLabelAlign = labelAlignProp ?? formCtx?.labelAlign ?? 'left';
  const resolvedShowFeedback = showFeedbackProp ?? formCtx?.showFeedback ?? true;

  const resolvedRequired = useMemo(() => {
    if (requiredProp !== undefined) return requiredProp;
    return isFieldRequired(resolvedRules);
  }, [requiredProp, resolvedRules]);

  const resolvedShowRequireMark = useMemo(() => {
    if (formCtx?.showRequireMark !== undefined) return formCtx.showRequireMark;
    return resolvedRequired;
  }, [formCtx?.showRequireMark, resolvedRequired]);

  const validate = useCallback(
    async (trigger?: string): Promise<readonly FieldError[]> => {
      const rules = resolvedRules;
      if (!rules) return [];
      const modelVal = formCtx?.model ?? {};
      const value = path ? getNestedValue(modelVal, path) : undefined;

      let rulesToApply = rules;
      if (trigger) {
        const arr = Array.isArray(rulesToApply) ? rulesToApply : [rulesToApply];
        const filtered = arr.filter((r) => {
          const rTrigger = (r as Record<string, unknown>)['trigger'];
          return (
            !rTrigger ||
            rTrigger === trigger ||
            (Array.isArray(rTrigger) && rTrigger.includes(trigger))
          );
        });
        if (filtered.length === 0) return [];
        rulesToApply = filtered;
      }

      setValidating(true);
      const name = path ?? '__unknown__';
      const fieldSpec = {
        name,
        rules: Array.isArray(rulesToApply) ? rulesToApply : [rulesToApply],
      };
      const errs = await validateField(fieldSpec, value);
      setErrors(errs);
      setValidating(false);
      return errs;
    },
    [resolvedRules, formCtx, path],
  );

  const restoreValidation = useCallback(() => {
    setErrors([]);
  }, []);

  // Register/unregister with parent form
  const apiRef = useRef<FormItemApi | null>(null);
  if (apiRef.current === null) {
    apiRef.current = {
      get path() {
        return path;
      },
      validate,
      restoreValidation,
    };
  } else {
    // Update stable refs
    apiRef.current = { path, validate, restoreValidation };
  }

  useEffect(() => {
    const api = apiRef.current!;
    formCtx?.registerItem(api);
    return () => {
      formCtx?.unregisterItem(api);
    };
  }, [formCtx]);

  const hasLabel = label !== undefined;
  const hasError = errors.length > 0;

  const itemClassName = useMemo(
    () =>
      resolveFormItemClassList({
        size: resolvedSize,
        labelPlacement: resolvedLabelPlacement,
        hasLabel,
        hasError,
      }).join(' '),
    [resolvedSize, resolvedLabelPlacement, hasLabel, hasError],
  );

  const labelClassName = useMemo(
    () =>
      resolveFormLabelClassList({
        showRequireMark: resolvedShowRequireMark,
        labelAlign: resolvedLabelAlign,
      }).join(' '),
    [resolvedShowRequireMark, resolvedLabelAlign],
  );

  const blankClassName = useMemo(
    () => resolveFormBlankClassList({ hasError }).join(' '),
    [hasError],
  );

  const feedbackClassName = useMemo(
    () => resolveFormFeedbackClassList({ isError: hasError }).join(' '),
    [hasError],
  );

  const labelStyle = useMemo<CSSProperties>(() => {
    const lw = labelWidthProp ?? formCtx?.labelWidth;
    if (lw === undefined) return {};
    return { width: typeof lw === 'number' ? `${lw}px` : lw };
  }, [labelWidthProp, formCtx?.labelWidth]);

  return (
    <div {...rest} className={itemClassName} data-testid="form-item">
      {hasLabel && (
        <label className={labelClassName} style={labelStyle}>
          {resolvedShowRequireMark && <span className="cx-ui-form-item-label__asterisk">*</span>}
          <span className="cx-ui-form-item-label__text">{label}</span>
        </label>
      )}
      <div className={blankClassName} data-testid="form-item-blank">
        {children}
      </div>
      {resolvedShowFeedback && hasError && (
        <div className={feedbackClassName}>
          {errors.map((e, i) => (
            <span key={i} className="cx-ui-form-item-feedback__line">
              {e.message}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
