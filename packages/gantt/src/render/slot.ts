/**
 * Argument bag passed to a slot template when it is invoked. Slot-specific
 * `args` shape is defined by the caller (e.g. `eventContent` receives
 * `{ event, timeText }`; `resourceLabelContent` receives `{ resource }`).
 * Core treats it as opaque.
 */
export interface SlotContext {
  readonly slot: string;
  readonly args: Readonly<Record<string, unknown>>;
}

/**
 * A user-supplied content template. The return type is `unknown` because
 * core does not know what framework is rendering — Vue returns `VNode[]`,
 * React returns `ReactNode`, plain DOM returns `Node | string`. Adapters
 * narrow the return at the boundary.
 */
export type SlotTemplate = (ctx: SlotContext) => unknown;

/**
 * Lookup table of slot name → template. Survives view changes; templates
 * are registered once at adapter mount and consulted on every render of
 * the matching slot.
 */
export interface SlotRegistry {
  get(slot: string): SlotTemplate | undefined;
  has(slot: string): boolean;
  register(slot: string, template: SlotTemplate): void;
  unregister(slot: string): void;
}

/**
 * Adapter-facing facade that resolves a slot name + args through a
 * `SlotRegistry` and returns framework-specific render output. The
 * implementation lives in each adapter (Vue3, React, Vue2); core only
 * declares the contract.
 */
export interface SlotRenderer {
  render(slot: string, args: Readonly<Record<string, unknown>>): unknown;
}
