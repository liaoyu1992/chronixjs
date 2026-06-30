import type { WatermarkProps } from './watermark-spec.js';

/**
 * Escape XML special characters in watermark text so the
 * resulting SVG remains well-formed when embedded in a `data:`
 * URL.
 */
function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Encode the Watermark props into a CSS-ready
 * `data:image/svg+xml,…` URL string.
 *
 * . Decision B.1 — SVG data-URI is the
 * lightweight primitive for repeating overlays;
 * browser tiles natively via `background-repeat`.
 *
 * The SVG contains a single `<text>` element rotated about the
 * tile center. Content is XML-escaped to handle `<`, `>`, `&`,
 * `"`, `'` safely. The returned URL is fully URL-encoded so it
 * can be assigned directly to `style.backgroundImage` /
 * `style.background-image` without further processing.
 *
 * Browser-serialization note (22-fr1): on read-back via
 * `element.style.backgroundImage` the browser preserves the
 * URL-encoded form but adds wrapping quotes / `url(...)`
 * decoration. Playwright assertions use
 * `.toContain('data:image/svg+xml')`.
 */
export function encodeWatermarkSvgDataUrl(props: WatermarkProps): string {
  const { content, width, height, rotate, fontSize, color, opacity } = props;
  const cx = width / 2;
  const cy = height / 2;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>` +
    `<text x='${cx}' y='${cy}' fill='${color}' fill-opacity='${opacity}' ` +
    `font-size='${fontSize}' font-family='sans-serif' text-anchor='middle' ` +
    `dominant-baseline='middle' transform='rotate(${rotate} ${cx} ${cy})'>` +
    `${escapeXmlText(content)}</text></svg>`;
  // `encodeURIComponent` leaves `'`, `(`, `)` unescaped — but
  // unquoted CSS `url(...)` rejects those characters (the inner
  // parens break the outer parens balance; the apostrophes break
  // the unquoted-URL grammar). Post-encode all three.
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
  return `data:image/svg+xml,${encoded}`;
}
