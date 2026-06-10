import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { DemoApp } from './DemoApp.js';
import './styles.css';

const rootEl = document.getElementById('root');
if (rootEl == null) {
  throw new Error('#root element not found');
}

createRoot(rootEl).render(
  <StrictMode>
    <DemoApp />
  </StrictMode>,
);
