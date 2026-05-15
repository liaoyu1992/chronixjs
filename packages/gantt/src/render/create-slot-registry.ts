import type { SlotRegistry, SlotTemplate } from './slot.js';

/**
 * Build a fresh `SlotRegistry`. Templates register / unregister via
 * the returned methods; the registry holds a private `Map<string,
 * SlotTemplate>` keyed by slot name. Multiple registrations to the
 * same slot replace the previous template (no merge / no stacking).
 *
 * Consumers typically build one registry at app setup time, register
 * all their templates, and pass it as
 * `<ChronixGantt :slot-registry="registry">`. The adapter consults
 * the registry per render — registering a new template after mount
 * is reactive: the next pass picks it up automatically.
 *
 * The registry is consumer-owned: chronix's adapter never creates one
 * implicitly. When the `slotRegistry` prop is undefined, every slot
 * site falls through to its default rendering (e.g. the default
 * `<rect class="cx-gantt-bar">` for the `'bar'` slot).
 */
export function createSlotRegistry(): SlotRegistry {
  const templates = new Map<string, SlotTemplate>();
  return {
    get(slot) {
      return templates.get(slot);
    },
    has(slot) {
      return templates.has(slot);
    },
    register(slot, template) {
      templates.set(slot, template);
    },
    unregister(slot) {
      templates.delete(slot);
    },
  };
}
