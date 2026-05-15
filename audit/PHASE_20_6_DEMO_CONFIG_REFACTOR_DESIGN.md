# Phase 20.6 — Demo config-driven refactor (URL-query-as-config)

**Status**: **DONE (2026-05-16)**. Landed as 2 commits: `5e85bd9`
(design doc, 342 lines) → `975a8d4` (implementation: demo-config.ts

- useDemoConfig composable + sample-callbacks.ts extraction + App.vue
  refactor + URL schema panel + 10 unit tests). 10 new unit tests pass;
  existing 27 parity assertions + 5 chronix VRT baselines unchanged
  (default URL state = pre-refactor state by construction). Cumulative
  vitest 443 → 453. App.vue's per-toggle cost dropped from ~30 LOC to
  ~3 LOC. `/phase-close` gate walked 6/6 green before status flip. See
  `audit/journal/2026-05-13.md` "Phase 20.5 + 20.6" section.

## Problem

`examples/gantt-vue3/src/App.vue` has grown to ~360 lines because
every demo toggle is hand-wired:

- 2 Phase 4 toggles: `editable`, `selectable` (ref + checkbox + binding)
- 1 Phase 17 mode flag: `isParityMode` (URL query → readonly bool)
- 4 Phase 19 validator toggles: `useEventOverlap`, `useEventConstraint`,
  `useEventAllow`, `useSelectAllow`
- 3 Phase 20 styling toggles: `useThemedBars`, `useUmbrellaColor`,
  `usePriorityCallback`
- 1 Phase 20 URL flag: `isPriorityCallbackParity`
- 4 Phase 19 sample predicate constants
- 4 Phase 20 sample callback constants
- ~8 `computed` indirections threading toggle state into adapter props

The pattern is **toggle-state + computed-active-prop + UI checkbox**
per option, ~30 LOC each. With 100 phases remaining (~80 of which
will introduce 1-3 toggles each), naive growth = ~150 more toggles =
~4500 LOC of demo plumbing. The demo will be larger than the
adapter.

Worse: each phase has to reinvent the toggle-add ceremony
(declaration + computed wrapper + template binding + reset). Three
of the validators added in Phase 19 were near-copies of each other.

## Goal

Each new demo toggle becomes **one entry in `demo-config.ts`** + one
line in the template. The config layer handles:

- URL query parsing (`?priorityCallback=true&barColor=%238b5cf6`)
- Default values
- Reactive Vue state (write back to URL on change for shareable links)
- Type-safe (boolean / string / number / function / enum)
- Documented schema (auto-generated URL doc table at the bottom of
  the page)

Adding a Phase 21 `todayLine` toggle becomes 1 line:

```ts
const config = useDemoConfig({
  // ... existing
  todayLine: bool(true), // default ON
});
```

## Approach

### New module: `examples/gantt-vue3/src/demo-config.ts`

```ts
import { ref, computed, watch, type Ref, type ComputedRef } from 'vue';

/** Helper factory builders. */
export interface ConfigField<T> {
  readonly default: T;
  readonly parse: (raw: string | null) => T;
  readonly serialize: (value: T) => string | null;
  readonly description?: string;
}

export function bool(defaultValue: boolean, description?: string): ConfigField<boolean> {
  return {
    default: defaultValue,
    parse: (raw) => (raw === null ? defaultValue : raw === 'true'),
    serialize: (v) => (v === defaultValue ? null : String(v)),
    ...(description ? { description } : {}),
  };
}

export function str<T extends string>(
  defaultValue: T | undefined,
  description?: string,
): ConfigField<T | undefined> {
  return {
    default: defaultValue,
    parse: (raw) => (raw === null ? defaultValue : (raw as T)),
    serialize: (v) => (v === defaultValue ? null : (v ?? null)),
    ...(description ? { description } : {}),
  };
}

export function num(defaultValue: number, description?: string): ConfigField<number> {
  return {
    default: defaultValue,
    parse: (raw) => (raw === null ? defaultValue : Number.parseFloat(raw)),
    serialize: (v) => (v === defaultValue ? null : String(v)),
    ...(description ? { description } : {}),
  };
}

export function enumOf<T extends string>(
  values: readonly T[],
  defaultValue: T,
  description?: string,
): ConfigField<T> {
  return {
    default: defaultValue,
    parse: (raw) => (raw && values.includes(raw as T) ? (raw as T) : defaultValue),
    serialize: (v) => (v === defaultValue ? null : v),
    ...(description ? { description } : {}),
  };
}

/**
 * Build a reactive demo config from a schema object. Each field
 * resolves its initial value from the URL query (or default), then
 * watch + write back to URL on change so the user can share a
 * pre-configured demo link.
 *
 * SSR-safe: `typeof window` check at module load.
 */
export function useDemoConfig<S extends Readonly<Record<string, ConfigField<unknown>>>>(
  schema: S,
): {
  readonly [K in keyof S]: Ref<S[K] extends ConfigField<infer T> ? T : never>;
} & { readonly schema: S; readonly resetAll: () => void };
```

### Migration of existing 10 toggles to the new shape

Before (Phase 20 endgame):

```ts
const editable = ref(true);
const selectable = ref(true);
const isParityMode = typeof window !== 'undefined' && /* ... */;
const useEventOverlap = ref(false);
const useEventConstraint = ref(false);
const useEventAllow = ref(false);
const useSelectAllow = ref(false);
const useThemedBars = ref(false);
const useUmbrellaColor = ref(false);
const usePriorityCallback = ref(false);
const isPriorityCallbackParity = /* ... */;
```

After:

```ts
const config = useDemoConfig({
  editable: bool(true, 'Enable bar drag + edge resize'),
  selectable: bool(true, 'Enable calendar range-select on empty rows'),
  parity: bool(false, 'Swap demo data to k-ui-equivalent dataset'),
  // Phase 19 validators
  eventOverlap: bool(false, 'Reject cross-row time-intersecting drops'),
  eventConstraint: bool(false, 'Constrain to today 08:00-20:00'),
  eventAllow: bool(false, 'Reject drops/resizes starting before 08:00'),
  selectAllow: bool(false, 'Reject range-selects wider than 4h'),
  // Phase 20 bar styling
  themedBars: bool(false, 'Override bar bg + border via theme'),
  umbrellaColor: bool(false, 'Use barColor umbrella prop'),
  priorityCallback: bool(false, 'Per-priority bar background callback'),
});
```

URL → `?eventOverlap=true&priorityCallback=true` activates exactly
those two. URL → empty resets all to defaults. URL is updated when
user toggles, so the displayed link is always shareable.

### Sample predicate exports stay in `App.vue` (or extract to `sample-callbacks.ts`)

The validator predicates + bar-color callbacks themselves are not
moved — they're domain logic, not config. They live in App.vue (or
a new `sample-callbacks.ts` if extraction is approved). Config
references them via name when toggle is on.

### Self-documenting URL schema panel

Below the chart, render a `<details>` collapsible:

```
URL flags (10):
?editable=true|false (default true) — Enable bar drag + edge resize
?selectable=true|false (default true) — Enable calendar range-select on empty rows
?parity=true|false (default false) — Swap demo data to k-ui-equivalent dataset
?eventOverlap=true|false (default false) — Reject cross-row time-intersecting drops
...
```

Auto-generated from the `schema` object — no hand-maintained docs.

### App.vue size reduction

- Before: 360 LOC
- After: estimated ~250 LOC (-30%)
- Plus `demo-config.ts` ~150 LOC (lib-level, reusable for next 80
  phases)
- Plus `sample-callbacks.ts` ~60 LOC (optional extraction)

Net: similar total LOC today, but per-phase ADD cost drops from ~30
LOC to ~3 LOC.

### Alternative approaches considered

1. **Pinia store for demo config**. Rejected — Pinia is a dependency
   not needed for a single-component demo + adds boilerplate vs Vue's
   built-in refs.

2. **Single object ref `config.value.editable`**. Rejected — Vue's
   ref-of-ref ergonomics (`config.editable.value` in template) are
   strictly nicer for two-way binding than nested objects.

3. **localStorage persistence** instead of URL query. Rejected — URL
   is shareable + survives reload + works for cross-demo parity tests
   that drive the demo via `page.goto('/?parity=true')`. localStorage
   is host-state, not URL-state.

4. **Single global URLSearchParams write-back**. Rejected — writing
   on every toggle change creates URL noise; only writing
   non-default values keeps URLs clean.

5. **Co-locate validator predicates + bar-color callbacks in
   demo-config.ts**. Rejected — predicates are domain code (e.g.
   `proposal.range.start.getHours() >= 8`), not config. Mixing the
   two confuses the surface.

## Parity assertion plan — MANDATORY

This phase is **chronix-only infrastructure** (the demo), not a
chronix feature port. The cross-demo parity layer is k-ui demo vs
chronix demo — neither side's rendered output changes from this
refactor (the toggles default to the same values they did
pre-refactor).

**chronix-new — no parity assertion possible.** Rationale: this
phase touches the example app's plumbing only. The 27 existing
parity assertions stay green because:

1. Default URL (no query) produces the same demo state as before:
   `editable: true, selectable: true, parity: false, all-validators-OFF, all-styling-toggles-OFF`
2. `?parity=true` URL still loads the parity dataset + bar color
   defaults (`#3788d8`) — the path the 3 cross-demo parity tests
   in parity.spec.ts exercise
3. `?priorityCallback=true` URL still wires the priority callback
   in parity mode — Phase 20's test 2

The diff isolation: parity.spec.ts at HEAD must produce identical
test results before and after the refactor commit.

## Test coverage

- core: no changes
- adapter: no changes
- example: new `examples/gantt-vue3/src/demo-config.test.ts` (~6 tests):
  - `bool(default)` parses `?key=true|false|missing` correctly
  - `str(default)` handles undefined + empty + encoded values
  - `num(default)` handles parseFloat edge cases
  - `enumOf` rejects out-of-set values, falls back to default
  - `useDemoConfig` round-trips URL → ref → URL
  - `useDemoConfig` writes back to URL only non-default values
- parity: nothing new in this phase
- browser-verify: load default URL → toggle each → confirm URL
  updates with non-default flag; reload URL → state persists; click
  reset → URL strips all flags

## VRT impact

**None expected**. Default render is byte-identical to pre-refactor.
All 5 chronix VRT baselines stay green. If they drift, the refactor
introduced a defect.

## Execution plan — 1 commit + wrap-up

### Commit 1: `feat(example-gantt-vue3): URL-query demo config + 10-toggle migration (Phase 20.6)`

- `examples/gantt-vue3/src/demo-config.ts` (new): `bool` / `str` /
  `num` / `enumOf` field factories + `useDemoConfig` composable +
  schema introspection
- `examples/gantt-vue3/src/demo-config.test.ts` (new): 6 unit tests
- `examples/gantt-vue3/src/sample-callbacks.ts` (new, optional): move
  `sampleEventOverlap` / `sampleEventConstraint` /
  `sampleEventAllow` / `sampleSelectAllow` /
  `samplePriorityCallback` here for App.vue cleanup
- `examples/gantt-vue3/src/App.vue`: migrate all 10 toggle states to
  `useDemoConfig`; bind template checkboxes to config refs;
  computed-active-prop indirections collapse where possible
- `examples/gantt-vue3/src/App.vue`: add `<details>` URL-schema
  panel at page bottom
- **Browser verify**: load default URL → all 5 VRT baselines
  pixel-equivalent; toggle each option → URL updates; reload URL →
  state restored
- **Anti-regression**: 27 parity assertions green; 5 VRT baselines
  unchanged

### Commit 2 (wrap-up — REQUIRES `/phase-close` invocation)

- Journal Phase 20.6 section
- Memory bump
- Status flip → DONE

## Estimated scope

- `demo-config.ts` (config helper + composable): ~150 LOC (~1.5 h)
- `demo-config.test.ts` (6 tests): ~100 LOC (~45 min)
- `sample-callbacks.ts` extraction: ~60 LOC (~30 min)
- App.vue refactor: ~-100 LOC delta (~1 h)
- URL-schema `<details>` panel: ~30 LOC (~30 min)
- Browser verify + VRT confirm: ~30 min
- Wrap-up: ~30 min
- **Total: ~4-5 hours focused work, ~340 LOC net add**

## Open questions for the user

1. **Approve URL query as the persistence layer** (vs localStorage,
   global Pinia store, or in-memory only)? Recommended: URL — shareable
   - reload-safe + already used by Phase 17 (`?parity=true`) and Phase
     20 (`?priorityCallback=true`).

2. **Approve auto-writing URL when toggle changes** (default-value
   filtering keeps URLs clean)? Recommended: yes — shareable demo
   links are a feature, not noise.

3. **Approve string-literal-union for `enumOf`** (e.g. `enumOf(['day',
'week', ...], 'day')` for view-id-style fields)? Recommended: yes
   — Phase 21+ view config will need this.

4. **Approve `sample-callbacks.ts` extraction** for validator
   predicates + bar-color callbacks? Or keep them inline in App.vue?
   Recommended: extract — domain code separation from demo plumbing
   is cleaner long-term.

5. **Approve `<details>` URL-schema panel auto-generated from schema
   introspection** (vs hand-maintained docs comment)? Recommended:
   auto-generate — schema is source of truth.

6. **Approve no changes to existing 27 parity assertions** (they
   default-URL-state-load and behave identically)? Recommended: yes,
   that's the safety guarantee of the refactor.

7. **Approve single-commit implementation + wrap-up commit**? This
   phase's diff is mostly demo-internal — minimal risk to feature
   parity. Recommended: yes.

Reply **按照推荐继续** to accept all defaults (URL persistence,
auto-write URL, string-literal enums, sample-callbacks.ts extraction,
auto-gen schema doc, no parity changes, single-commit impl).
