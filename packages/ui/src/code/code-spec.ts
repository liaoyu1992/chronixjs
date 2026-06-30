/**
 * Code IR — . Tier A `<pre><code>` block.
 * No syntax highlighting in v0.1.0-alpha (deferred per design doc).
 */

export interface CodeProps {
  /** Code text content. Rendered inside `<code>`. */
  readonly value: string;
  /** When true, root is inline `<code>` (no `<pre>` wrapper). */
  readonly inline: boolean;
}

export const defaultCodeProps: CodeProps = {
  value: '',
  inline: false,
};
