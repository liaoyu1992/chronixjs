/**
 * PopSelect component IR — . Tier B option-list
 * popup surface. Wraps `<ChronixPopover>` at adapter scope with a
 * chronix-rendered list of options (per `options` prop, array-only
 * authoring per precedent).
 *
 * NO filter / search input (use `<ChronixAutoComplete>`
 * for filterable selection; Select for full multi+filter+async).
 * NO multi-select. NO virtual scrolling. Eventual `OptionSpec`
 * will unify these shapes.
 */

import type { PopupPlacement } from '../popup/popup-spec.js';
import type { PopupTrigger } from '../popup/trigger-spec.js';

export interface PopSelectOption {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly disabled: boolean;
}

export interface PopSelectProps {
  /** Current selected option's `value`. `undefined` = nothing selected. */
  readonly value: string | undefined;
  readonly options: readonly PopSelectOption[];
  readonly show: boolean | undefined;
  readonly trigger: PopupTrigger;
  readonly placement: PopupPlacement;
  readonly offset: number;
  readonly flip: boolean;
  readonly widthMatch: boolean;
  readonly disabled: boolean;
}

export const defaultPopSelectProps: PopSelectProps = {
  value: undefined,
  options: [],
  show: undefined,
  trigger: 'click',
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  widthMatch: false,
  disabled: false,
};
