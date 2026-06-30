/**
 * Thing IR — . Tier A composition card with
 * avatar + header (title + extra) + description + content + action
 * + footer slots.
 *
 * Per Decision A.1 Thing is one of the three
 * information-density Tier A primitives in this bundle. Per Phase
 * 19 PageHeader Decision B.1 + + 20 + 21 + 22 sub-component
 * foreclosure, Thing has no `<ChronixThingItem>` / `<ChronixThingGroup>`
 * sub-component — it's a single root component whose slots /
 * ReactNode-prop overrides drive 8 `--with-*` BEM modifiers plus
 * one `--content-indented` layout modifier.
 *
 * Slot collection (~7 slots total):
 *
 * - `avatar` — left-of-main illustration / icon / avatar.
 * - `header` (with same-name string prop `title`) — primary heading
 *   text.
 * - `header-extra` — right-aligned content within the header row
 *   (e.g. timestamp, badge, dropdown trigger).
 * - `description` (with same-name string prop `description`) — secondary
 *   text below the header.
 * - default — body content rendered below the description, above
 *   the action.
 * - `action` — interaction row (e.g. "Reply / Like / Share"
 *   buttons).
 * - `footer` — meta-info / divider row at the bottom.
 *
 * Public surface:
 *
 * - **`ThingProps`** + **`defaultThingProps`** — declarative props
 *   consumed by `ChronixThing` adapters.
 */

export interface ThingProps {
  /**
   * Header text. `undefined` opts out of the `__header-content` /
   * `--with-header` modifier unless the `header` slot is supplied.
   */
  readonly title: string | undefined;
  /**
   * Description text. `undefined` opts out of the `__description`
   * / `--with-description` modifier unless the `description` slot
   * is supplied.
   */
  readonly description: string | undefined;
  /**
   * When `true`, the `__content` block is indented to visually
   * align with `__header-content` past the `__avatar` column.
   * Useful for chat / comment thread layouts where the body
   * continues under the title rather than under the avatar.
   * Default `false`.
   */
  readonly contentIndented: boolean;
}

export const defaultThingProps: ThingProps = {
  title: undefined,
  description: undefined,
  contentIndented: false,
};
