/**
 * **Single source of truth for the cross-demo parity-vue2 dataset.**
 *
 * Mirrors the original demo's `examples/gantt/vue2/src/event-generator.js`
 * (`generateEvents()` → 9 events) + `examples/gantt/vue2/src/DemoApp.vue`
 * (`RESOURCES[]` → 9 entries with `d` having 2 children `d1` + `d2`,
 * flattened to 11 rows in chronix since chronix v0 doesn't model the
 * `children` hierarchy).
 *
 * Both the chronix-vue2 demo (when loaded with `?parity=true`) AND the
 * Playwright parity-vue2 tests (in `tests/parity-vue2.spec.ts`) consume
 * this module. Keeping the dataset in one place eliminates the drift
 * risk that would arise if the chronix-vue2 demo and the test fixture
 * each carried their own copy of "the 9 events used for cross-demo
 * comparison".
 *
 * Why this lives under `tooling/golden-runner/src/`:
 * - The dataset is a TESTING fixture, not chronix application code —
 *   chronix's published API surface (`@chronixjs/gantt`,
 *   `@chronixjs/gantt-vue2`) doesn't ship it.
 * - The chronix-vue2 example workspace already depends on
 *   `@chronixjs/golden-runner` transitively (via parity-mode loading
 *   the dataset), which is acceptable because example workspaces are
 *   not published to npm.
 *
 * Distinct from `parity-events.ts` (vue3 / 32-resource × 25-event
 * dataset) because original demo carries its own 9-resource ×
 * 9-event fixture rather than reusing reference-vue3's larger one.
 * Only the geometry-relevant fields (id, resourceId, start/end epoch
 * math) are mirrored; styling fields (backgroundColor, dependencies,
 * extendedProps, progress.backgroundColor / textColor / textFormat)
 * are NOT in scope because chronix-vue2 v0 parity only compares
 * observable geometry (x / width). The single exception is
 * `progressValue` (0..100) which IS mirrored because Phase 31.6.1
 * follow-up assertions will exercise the chronix Phase 28.x bar
 * progress overlay parity.
 */

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * The 11 resource ids in the original demo's `RESOURCES[]` array
 * order, with the `d` parent's 2 children (`d1` + `d2`) flattened in
 * place between `d` and `e` (matching the order children appear in
 * reference's tree-rendered output, top-to-bottom).
 *
 * Chronix v0 emits rows in this order, accepting that the rendered Y
 * position will NOT match reference's exactly because reference renders parent
 * `d` as a group header above its children while chronix renders all
 * 11 as peer rows. Cross-demo Y parity is parked until a resource-
 * hierarchy row sorter lands — same disposition as vue3 (see
 * `parity-events.ts:31-41` for the precedent).
 */
export const PARITY_RESOURCE_IDS_VUE2: readonly string[] = [
  'a',
  'b',
  'c',
  'd',
  'd1',
  'd2',
  'e',
  'f',
  'g',
  'h',
  'i',
];

export interface ParityEventVue2 {
  readonly id: string;
  readonly resourceId: string;
  readonly startMs: number;
  readonly endMs: number;
  /**
   * Bar title text. Mirrors reference-vue2 event-generator.js per-event
   * `title` field so the chronix-vue2 demo's bar-text auto-render
   * (Phase 31.4) emits a string and the cross-demo phase28.2-bar-text
   * count parity assertion has a non-zero baseline on both sides.
   */
  readonly title: string;
  /**
   * 0..100 progress percentage; undefined when the original event
   * has no `progress` field. Per reference-vue2 event-generator.js: only
   * events 6 / 7 / 8 / 9 carry a progress value.
   */
  readonly progressValue?: number;
  /**
   * Per-event bar background color matching reference-vue2's resolved
   * source-bar fill (after the original eventBackgroundColor
   * priority callback + resource eventColor cascade). Populated only
   * for events that appear as a source OR target of an entry in
   * `PARITY_LINKS_VUE2`, so chronix-vue2 paints those bars in
   * matching per-event colors — required for cross-demo
   * `useLineEventColor` link-stroke parity. Mirror of vue3's Phase
   * 28.3.1 dataset extension.
   *
   * Resolved colors per original demo (event-generator.js +
   * DemoApp.vue eventBackgroundColor callback + RESOURCES eventColor):
   *
   * - Event 1 (resource b, explicit `#4caf50`): `#4caf50`
   * - Event 2 (resource c, priority high → callback `#ff3b32`): `#ff3b32`
   * - Event 4 (resource e, no override → scheduler default): `#3788d8`
   * - Event 7 (resource b, no explicit + resource eventColor='green'): CSS `green` = `#008000`
   *
   * Events not referenced by any parity link leave this `undefined`
   * and inherit the chart-level parity-mode prop default
   * (`PARITY_REFERENCE_COLOR = '#3788d8'`).
   */
  readonly backgroundColor?: string;
}

/**
 * Build the 9 parity events relative to a `todayMs` epoch. The reference-vue2
 * `event-generator.js` uses `new Date()` at call time + `addDays`
 * arithmetic; Playwright tests install a frozen clock at `FROZEN_TIME_ISO`
 * before page load so both demos see the same `today` value. This
 * function takes that epoch as an argument so the chronix-vue2 demo
 * (which renders ts data at module load) can pass `Date.now()` while
 * tests pass the frozen-clock epoch.
 *
 * Time math mirrors `event-generator.js` verbatim:
 * - `addDays(today, n)` → `todayMidnight + n * MS_PER_DAY`
 * - `formatDateTime(date, hours, minutes)` → set hh:mm on that date,
 *   zero seconds/ms. Translated to epoch math:
 *   `todayMidnight + n * MS_PER_DAY + hours * MS_PER_HOUR
 *    + minutes * 60_000`.
 * - `formatDateStr(date)` → midnight of that date.
 *
 * **Locale floor**: `todayMs` is `Date.now()`, which is UTC ms. The
 * original spec Vue 2 demo's `event-generator.js` uses LOCAL
 * date arithmetic (`new Date()` then `setHours(...)`), anchored at
 * `today`'s LOCAL midnight. To match, this function floors `todayMs`
 * to LOCAL midnight via `new Date(todayMs).setHours(0, 0, 0, 0)`
 * (NOT via `Math.floor(todayMs / MS_PER_DAY) * MS_PER_DAY` which
 * would land on UTC midnight — 8 hours adrift under Asia/Shanghai,
 * = 416 px per hour-slot drift in week view). Cross-demo parity
 * bar-X tests require LOCAL alignment to pair byte-for-byte with
 * the original demo.
 */
export function buildParityEventsVue2(todayMs: number): readonly ParityEventVue2[] {
  const localMidnight = new Date(todayMs);
  localMidnight.setHours(0, 0, 0, 0);
  const todayMidnight = localMidnight.getTime();
  const dayMinus1 = todayMidnight - 1 * MS_PER_DAY;
  const dayMinus4 = todayMidnight - 4 * MS_PER_DAY;
  const dayMinus5 = todayMidnight - 5 * MS_PER_DAY;
  const dayPlus3 = todayMidnight + 3 * MS_PER_DAY;

  const at = (dayMs: number, hours: number, minutes = 0): number =>
    dayMs + hours * MS_PER_HOUR + minutes * 60_000;

  return [
    // Event 1: yesterday 02:00 → 07:00 on resource b
    {
      id: '1',
      resourceId: 'b',
      startMs: at(dayMinus1, 2),
      endMs: at(dayMinus1, 7),
      title: 'event 1 (自动调整)',
      backgroundColor: '#4caf50',
    },
    // Event 2: yesterday 05:00 → 22:00 on resource c (priority high → callback red)
    {
      id: '2',
      resourceId: 'c',
      startMs: at(dayMinus1, 5),
      endMs: at(dayMinus1, 22),
      title: 'event 2 (高优先级)',
      backgroundColor: '#ff3b32',
    },
    // Event 3: 5 days ago midnight → 3 days from now midnight on resource d
    { id: '3', resourceId: 'd', startMs: dayMinus5, endMs: dayPlus3, title: 'event 3 (已完成)' },
    // Event 4: yesterday 03:00 → 3 days from now 08:00 on resource e
    {
      id: '4',
      resourceId: 'e',
      startMs: at(dayMinus1, 3),
      endMs: at(dayPlus3, 8),
      title: 'event 4 (进行中)',
      backgroundColor: '#3788d8',
    },
    // Event 5: 4 days ago 00:30 → yesterday 02:30 on resource f
    {
      id: '5',
      resourceId: 'f',
      startMs: at(dayMinus4, 0, 30),
      endMs: at(dayMinus1, 2, 30),
      title: 'event 5 (中优先级)',
    },
    // Event 6: yesterday 08:00 → 12:00 on resource a, progress 50
    {
      id: '6',
      resourceId: 'a',
      startMs: at(dayMinus1, 8),
      endMs: at(dayMinus1, 12),
      title: 'event 6 (待处理)',
      progressValue: 50,
    },
    // Event 7: today 10:00 → 14:00 on resource b, progress 60 (resource b's
    // eventColor='green' = CSS keyword for #008000 applies in reference-vue2)
    {
      id: '7',
      resourceId: 'b',
      startMs: at(todayMidnight, 10),
      endMs: at(todayMidnight, 14),
      title: 'event 7 (进度 60%)',
      progressValue: 60,
      backgroundColor: '#008000',
    },
    // Event 8: today 15:00 → 18:00 on resource c, progress 80
    {
      id: '8',
      resourceId: 'c',
      startMs: at(todayMidnight, 15),
      endMs: at(todayMidnight, 18),
      title: 'event 8',
      progressValue: 80,
    },
    // Event 9: today 19:00 → 22:00 on resource a, progress 50
    {
      id: '9',
      resourceId: 'a',
      startMs: at(todayMidnight, 19),
      endMs: at(todayMidnight, 22),
      title: 'event 9 (进度 50%，默认颜色)',
      progressValue: 50,
    },
  ];
}

/**
 * Phase 37: parity-vue2 link dataset for the `phase28.3-useLineEventColor`
 * cross-demo parity tests. Mirrors the vue3 `PARITY_LINKS` 8-edge subset
 * (`tooling/golden-runner/src/parity-events.ts:226`) using reference-vue2 event
 * id format (`'1'` / `'2'` / ... instead of vue3's `'event-1'` / `'event-2'`).
 *
 * Asymmetry note: vue3's PARITY_LINKS has 8 edges including 2 (event-22→event-23,
 * event-23→event-24) that reference events outside vue2's 9-event subset.
 * vue2 ships the 6 in-range edges; cross-demo per-link count parity tests
 * for vue2 expect 6 links per side (not 8). reference-vue2's demo must also
 * paint these 6 dependency lines for the parity assertions to hold.
 *
 * Each link uses `routing: 'square'` + `marker: 'arrow'` matching vue3's
 * `parityLinkToSpec` shape (`sample-data-parity.ts:83-91`).
 */
export interface ParityLinkVue2 {
  readonly id: string;
  readonly fromBarId: string;
  readonly toBarId: string;
}

export const PARITY_LINKS_VUE2: readonly ParityLinkVue2[] = [
  { id: 'link-1-2', fromBarId: '1', toBarId: '2' },
  { id: 'link-1-4', fromBarId: '1', toBarId: '4' },
  { id: 'link-2-3', fromBarId: '2', toBarId: '3' },
  { id: 'link-4-5', fromBarId: '4', toBarId: '5' },
  { id: 'link-2-5', fromBarId: '2', toBarId: '5' },
  { id: 'link-7-8', fromBarId: '7', toBarId: '8' },
];

/**
 * Phase 37: thin wrapper around PARITY_LINKS_VUE2 for symmetry with
 * `buildParityEventsVue2()`; future per-anchor / per-view filtering
 * lives here without breaking call sites.
 */
export function buildParityLinksVue2(): readonly ParityLinkVue2[] {
  return PARITY_LINKS_VUE2;
}
