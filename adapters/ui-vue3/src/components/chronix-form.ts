/**
 * chronix-ui Vue 3 ChronixForm + ChronixFormItem — Phase 34 (2026-06-05).
 *
 * ChronixForm wraps model + rules, provides registration context via
 * inject/provide. ChronixFormItem registers itself, handles validation
 * display. Uses Phase 6 validateField/validateForm IR.
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
  computed,
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  type InjectionKey,
  type PropType,
} from 'vue';

import { useUIContext } from '../composables/use-ui-context.js';

// ---------------------------------------------------------------------------
// FormItem registration API (provided by Form, consumed by FormItem)
// ---------------------------------------------------------------------------

export interface FormItemApi {
  readonly path: string | undefined;
  validate(trigger?: string): Promise<readonly FieldError[]>;
  restoreValidation(): void;
}

/** ValidationRule extended with an optional trigger for filtering. */
interface TriggerableRule extends ValidationRule {
  trigger?: string | string[];
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

const FORM_INJECTION_KEY: InjectionKey<FormRegistrationContext> = Symbol('ChronixFormContext');

// ---------------------------------------------------------------------------
// ChronixForm
// ---------------------------------------------------------------------------

export const ChronixForm = defineComponent({
  name: 'ChronixForm',
  inheritAttrs: false,
  props: {
    model: { type: Object, default: () => ({}) },
    rules: { type: Object, default: undefined },
    labelPlacement: {
      type: String as PropType<FormLabelPlacement>,
      default: defaultFormProps.labelPlacement,
    },
    labelWidth: { type: [Number, String], default: undefined },
    labelAlign: {
      type: String as PropType<FormLabelAlign>,
      default: defaultFormProps.labelAlign,
    },
    inline: { type: Boolean, default: defaultFormProps.inline },
    size: { type: String as PropType<FormSize>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    showFeedback: { type: Boolean, default: defaultFormProps.showFeedback },
    showRequireMark: { type: Boolean, default: defaultFormProps.showRequireMark },
    preventSubmit: { type: Boolean, default: defaultFormProps.preventSubmit },
  },
  setup(props, { slots, attrs, expose }) {
    ensureChronixFormStyles();
    const ctx = useUIContext();
    const items = new Set<FormItemApi>();

    const resolvedSize = computed(() => props.size ?? ctx.value.size);
    const resolvedDisabled = computed(() => props.disabled ?? ctx.value.disabled);

    const rootClass = computed(() =>
      resolveFormClassList({
        inline: props.inline,
        labelPlacement: props.labelPlacement,
      }).join(' '),
    );

    const labelWidthStyle = computed(() => {
      if (props.labelWidth === undefined) return undefined;
      const w = typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : props.labelWidth;
      return { '--cx-ui-form-label-width': w };
    });

    function registerItem(api: FormItemApi): void {
      items.add(api);
    }
    function unregisterItem(api: FormItemApi): void {
      items.delete(api);
    }

    provide<FormRegistrationContext>(FORM_INJECTION_KEY, {
      get rules() {
        return props.rules ?? {};
      },
      get model() {
        return props.model;
      },
      get showFeedback() {
        return props.showFeedback;
      },
      get showRequireMark() {
        return props.showRequireMark;
      },
      get labelPlacement() {
        return props.labelPlacement;
      },
      get labelWidth() {
        return props.labelWidth;
      },
      get labelAlign() {
        return props.labelAlign;
      },
      get size() {
        return resolvedSize.value;
      },
      get disabled() {
        return resolvedDisabled.value;
      },
      registerItem,
      unregisterItem,
    });

    async function validate(): Promise<{ errors: Record<string, readonly FieldError[]> }> {
      const errors: Record<string, readonly FieldError[]> = {};
      const promises = Array.from(items).map(async (item) => {
        const errs = await item.validate();
        if (errs.length > 0 && item.path) {
          errors[item.path] = errs;
        }
      });
      await Promise.all(promises);
      return { errors };
    }

    function restoreValidation(): void {
      for (const item of items) {
        item.restoreValidation();
      }
    }

    expose({ validate, restoreValidation });

    return () =>
      h(
        'form',
        {
          class: rootClass.value,
          style: labelWidthStyle.value,
          'data-testid': 'form-root',
          ...attrs,
          onSubmit: (e: Event) => {
            if (props.preventSubmit) e.preventDefault();
          },
        },
        slots['default'] ? slots['default']() : [],
      );
  },
});

// ---------------------------------------------------------------------------
// ChronixFormItem
// ---------------------------------------------------------------------------

export const ChronixFormItem = defineComponent({
  name: 'ChronixFormItem',
  inheritAttrs: false,
  props: {
    label: { type: String, default: undefined },
    path: { type: String, default: undefined },
    rule: { type: [Object, Array], default: undefined },
    showFeedback: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    labelWidth: { type: [Number, String], default: undefined },
    labelAlign: { type: String as PropType<FormLabelAlign>, default: undefined },
    labelPlacement: { type: String as PropType<FormLabelPlacement>, default: undefined },
    size: { type: String as PropType<FormSize>, default: undefined },
  },
  setup(props, { slots, attrs, expose }) {
    const formCtx = inject<FormRegistrationContext | null>(FORM_INJECTION_KEY, null);

    const errors = ref<readonly FieldError[]>([]);
    const validating = ref(false);

    function resolvedRules(): ValidationRule | readonly ValidationRule[] | undefined {
      if (props.rule !== undefined) return props.rule as ValidationRule | readonly ValidationRule[];
      if (!props.path || !formCtx) return undefined;
      return formCtx.rules[props.path];
    }

    function resolvedSize(): FormSize {
      return props.size ?? formCtx?.size ?? 'medium';
    }

    function resolvedLabelPlacement(): FormLabelPlacement {
      return props.labelPlacement ?? formCtx?.labelPlacement ?? 'top';
    }

    function resolvedLabelAlign(): FormLabelAlign {
      return props.labelAlign ?? formCtx?.labelAlign ?? 'left';
    }

    function resolvedShowFeedback(): boolean {
      return props.showFeedback ?? formCtx?.showFeedback ?? true;
    }

    function resolvedRequired(): boolean {
      if (props.required !== undefined) return props.required;
      return isFieldRequired(resolvedRules());
    }

    function resolvedShowRequireMark(): boolean {
      if (formCtx?.showRequireMark !== undefined) return formCtx.showRequireMark;
      return resolvedRequired();
    }

    async function validate(trigger?: string): Promise<readonly FieldError[]> {
      const rules = resolvedRules();
      if (!rules) return [];
      const model = formCtx?.model ?? {};
      const value = props.path ? getNestedValue(model, props.path) : undefined;

      let rulesToApply = rules;
      if (trigger) {
        const arr = Array.isArray(rulesToApply) ? rulesToApply : [rulesToApply];
        const filtered = arr.filter((r: ValidationRule) => {
          const t = (r as TriggerableRule).trigger;
          return !t || t === trigger || (Array.isArray(t) && t.includes(trigger));
        });
        if (filtered.length === 0) return [];
        rulesToApply = filtered;
      }

      validating.value = true;
      const name = props.path ?? '__unknown__';
      const fieldSpec = {
        name,
        rules: Array.isArray(rulesToApply) ? rulesToApply : [rulesToApply],
      };
      const errs = await validateField(fieldSpec, value);
      errors.value = errs;
      validating.value = false;
      return errs;
    }

    function restoreValidation(): void {
      errors.value = [];
    }

    const api: FormItemApi = {
      get path() {
        return props.path;
      },
      validate,
      restoreValidation,
    };

    onMounted(() => {
      formCtx?.registerItem(api);
    });
    onBeforeUnmount(() => {
      formCtx?.unregisterItem(api);
    });

    expose({ validate, restoreValidation });

    return () => {
      const hasLabel = props.label !== undefined;
      const hasError = errors.value.length > 0;
      const lp = resolvedLabelPlacement();
      const la = resolvedLabelAlign();

      const itemClass = resolveFormItemClassList({
        size: resolvedSize(),
        labelPlacement: lp,
        hasLabel,
        hasError,
      }).join(' ');

      const labelClass = resolveFormLabelClassList({
        showRequireMark: resolvedShowRequireMark(),
        labelAlign: la,
      }).join(' ');

      const blankClass = resolveFormBlankClassList({ hasError }).join(' ');

      const feedbackClass = resolveFormFeedbackClassList({ isError: hasError }).join(' ');

      const labelStyle: Record<string, string> = {};
      const lw = props.labelWidth ?? formCtx?.labelWidth;
      if (lw !== undefined) {
        labelStyle['width'] = typeof lw === 'number' ? `${lw}px` : lw;
      }

      return h('div', { class: itemClass, ...attrs, 'data-testid': 'form-item' }, [
        // Label
        hasLabel
          ? h('label', { class: labelClass, style: labelStyle }, [
              resolvedShowRequireMark()
                ? h('span', { class: 'cx-ui-form-item-label__asterisk' }, '*')
                : null,
              h('span', { class: 'cx-ui-form-item-label__text' }, props.label),
            ])
          : null,
        // Blank (content)
        h(
          'div',
          { class: blankClass, 'data-testid': 'form-item-blank' },
          slots['default'] ? slots['default']() : [],
        ),
        // Feedback
        resolvedShowFeedback() && hasError
          ? h(
              'div',
              { class: feedbackClass },
              errors.value.map((e, i) =>
                h('span', { key: i, class: 'cx-ui-form-item-feedback__line' }, e.message),
              ),
            )
          : null,
      ]);
    };
  },
});
