import { registerQrCodeEncoder } from '@chronixjs/ui';
import qrcode from 'qrcode-generator';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App.js';

import './styles.css';

// Phase 22 — register the optional QR encoder factory so
// <ChronixQrCode> renders the SVG matrix instead of the
// `--unavailable` placeholder.
registerQrCodeEncoder(qrcode);

const rootEl = document.getElementById('root');
if (rootEl == null) {
  throw new Error('#root element not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
