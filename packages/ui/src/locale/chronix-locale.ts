/**
 * chronix-ui locale spec.
 *
 * Phase 2 (2026-06-01) shipped a `{ name }` stub.
 * Phase 3 (2026-06-02) extends to:
 *
 * - `ChronixLocaleCommon` slice — universal verbs / states / labels
 *   shared across every component (OK, Cancel, Loading, No data, …).
 * - `ChronixLocale` top-level interface — `name` (BCP 47 tag) + `common`
 *   slice + room for per-component slices that future phases will append
 *   as their components land (e.g. Phase 77 adds `datePicker`, Phase 90
 *   adds `form`, …).
 * - 3 preset locales shipped from Phase 3: `defaultEnUSLocale` (English),
 *   `defaultZhCNLocale` (Simplified Chinese), `defaultJaJPLocale`
 *   (Japanese). Additional locales (de-DE, fr-FR, etc.) are consumer-
 *   contributed via `registerLocale` (see `./locale-registry.ts`).
 *
 * Mirrors the theme module's nested-slice pattern (Phase 0.1 Decision B.1):
 * `common` is the shared baseline, per-component slices are optional
 * extensions. Composition via `mergeLocales` (see `./merge-locales.ts`)
 * follows the same shallow-per-slice semantics as `mergeChronixUITheme`.
 */

/**
 * Universal locale messages used by every component. Each key is a
 * single short label or sentence; no interpolation parameters in
 * Phase 3 (parameterized messages — e.g. "Showing {start}-{end} of
 * {total}" — land per-component as ICU format function fields).
 */
export interface ChronixLocaleCommon {
  /** Affirmative button label — primary action in dialogs / popconfirms. */
  readonly ok: string;
  /** Negative button label — dismiss action in dialogs / popconfirms. */
  readonly cancel: string;
  /** Strong-affirmative label — confirm a non-trivial action. */
  readonly confirm: string;
  /** Clear-input action label — clears the current value of a field. */
  readonly clear: string;
  /** Reset-to-default action label. */
  readonly reset: string;
  /** Apply-changes action label. */
  readonly apply: string;
  /** Save-changes action label. */
  readonly save: string;
  /** Delete-item action label (typically destructive). */
  readonly del: string;
  /** Remove-from-collection action label (non-destructive). */
  readonly remove: string;
  /** Add-item action label. */
  readonly add: string;
  /** Edit-item action label. */
  readonly edit: string;
  /** Search-action / search-input placeholder label. */
  readonly search: string;
  /** Close-popover / close-dialog action label. */
  readonly close: string;
  /** Loading-state placeholder (typically with trailing ellipsis). */
  readonly loading: string;
  /** Empty-state placeholder when no data is available. */
  readonly noData: string;
  /** Generic error-state label. */
  readonly error: string;
  /** Generic success-state label. */
  readonly success: string;
  /** Generic warning-state label. */
  readonly warning: string;
  /** Generic info-state label. */
  readonly info: string;
}

/**
 * Top-level chronix-ui locale. Phase 3 ships `name` + `common`. Per-
 * component slices (DatePicker, Form, Upload, Pagination, …) are
 * declared with `?` optional modifier and added by their respective
 * component phases; consumers without those components see no overhead.
 *
 * Adapters consume the active locale via `useUIContext().locale`. To
 * read a message key, use direct property access:
 *
 * ```ts
 * const ctx = useUIContext();
 * const okLabel = ctx.locale.common.ok;
 * ```
 *
 * Per-component slices are accessed with optional chaining since they
 * may not be populated in all consumer-built locales:
 *
 * ```ts
 * const placeholder = ctx.locale.datePicker?.placeholder ?? 'Select date';
 * ```
 */
export interface ChronixLocale {
  /**
   * BCP 47 locale tag. Examples: `'en-US'`, `'zh-CN'`, `'ja-JP'`. Used
   * by adapters to feed `Intl.*` APIs (`Intl.NumberFormat`,
   * `Intl.DateTimeFormat`, `Intl.Collator`, …) and by `localeRegistry`
   * for lookup keys.
   */
  readonly name: string;

  /**
   * Universal message slice shared across every component. Always
   * required so consumers can rely on these keys without per-component
   * fallback noise.
   */
  readonly common: ChronixLocaleCommon;
}

/**
 * Partial overlay applied on top of a `ChronixLocale` via `mergeLocales`.
 * Every slice (and every field within a slice) is optional; the merge
 * function treats missing fields as "preserve base" and supplied fields
 * as overrides.
 */
export interface ChronixLocaleOverrides {
  readonly name?: string;
  readonly common?: Partial<ChronixLocaleCommon>;
}

/**
 * English (United States) preset. Phase 3 baseline locale.
 */
export const defaultEnUSLocale: ChronixLocale = {
  name: 'en-US',
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    confirm: 'Confirm',
    clear: 'Clear',
    reset: 'Reset',
    apply: 'Apply',
    save: 'Save',
    del: 'Delete',
    remove: 'Remove',
    add: 'Add',
    edit: 'Edit',
    search: 'Search',
    close: 'Close',
    loading: 'Loading...',
    noData: 'No data',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
  },
};

/**
 * Simplified Chinese preset.
 */
export const defaultZhCNLocale: ChronixLocale = {
  name: 'zh-CN',
  common: {
    ok: '确定',
    cancel: '取消',
    confirm: '确认',
    clear: '清除',
    reset: '重置',
    apply: '应用',
    save: '保存',
    del: '删除',
    remove: '移除',
    add: '添加',
    edit: '编辑',
    search: '搜索',
    close: '关闭',
    loading: '加载中...',
    noData: '暂无数据',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '提示',
  },
};

/**
 * Japanese preset.
 */
export const defaultJaJPLocale: ChronixLocale = {
  name: 'ja-JP',
  common: {
    ok: 'OK',
    cancel: 'キャンセル',
    confirm: '確認',
    clear: 'クリア',
    reset: 'リセット',
    apply: '適用',
    save: '保存',
    del: '削除',
    remove: '取り除く',
    add: '追加',
    edit: '編集',
    search: '検索',
    close: '閉じる',
    loading: '読み込み中...',
    noData: 'データなし',
    error: 'エラー',
    success: '成功',
    warning: '警告',
    info: '情報',
  },
};
