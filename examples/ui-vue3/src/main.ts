import { registerQrCodeEncoder } from '@chronixjs/ui';
import qrcode from 'qrcode-generator';
import { createApp } from 'vue';

import App from './App.vue';
import './styles.css';

// Phase 22 — register the optional QR encoder factory so
// <ChronixQrCode> renders the SVG matrix instead of the
// `--unavailable` placeholder.
registerQrCodeEncoder(qrcode);

createApp(App).mount('#app');
