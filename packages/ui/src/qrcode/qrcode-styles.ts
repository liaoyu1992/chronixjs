/**
 * QrCode stylesheet — Phase 22 (2026-06-03).
 *
 * Renders the QR matrix as an `<svg>` element when an encoder is
 * registered + the value encodes successfully. The SVG carries
 * `viewBox='0 0 N N'` so a single `width` / `height` attribute
 * pair scales the entire matrix; the adapter sets these from
 * `props.size`. Dark modules are 1×1 `<rect>` children at integer
 * positions.
 *
 * The `--unavailable` placeholder renders as a plain `<div>` with
 * a clear "QR encoder unavailable" message. Background +
 * foreground colors come from theme tokens.
 *
 * Two-level fallback (`var(--cx-ui-qrcode-*, fallback)`) keeps
 * the surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_QRCODE_CSS = `
.cx-ui-qrcode {
  display: inline-block;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-qrcode-font-size, 12px);
  line-height: 1.3;
}

.cx-ui-qrcode__svg {
  display: block;
  /* width + height attribute set inline by adapter from props.size. */
}

.cx-ui-qrcode--unavailable {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--cx-ui-qrcode-unavailable-padding, 16px);
  background: var(--cx-ui-qrcode-unavailable-bg, #f3f4f6);
  border: 1px dashed var(--cx-ui-qrcode-unavailable-border-color, #d1d5db);
  border-radius: var(--cx-ui-qrcode-border-radius, 4px);
  color: var(--cx-ui-qrcode-unavailable-color, #6b7280);
  /* width + height inline by adapter from props.size for a stable footprint. */
}

.cx-ui-qrcode__unavailable-message {
  max-width: 16ch;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'qrcode';

let injected = false;

/**
 * Inject the QrCode stylesheet into `document.head` exactly once.
 * Sticky-flag semantics — once injected (or detected) the flag
 * stays `true` even if the `<style>` element is later removed by
 * the consumer.
 */
export function ensureChronixQrCodeStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_QRCODE_CSS;
  document.head.appendChild(style);
  injected = true;
}
