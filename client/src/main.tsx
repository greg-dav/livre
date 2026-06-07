import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// The app scrolls inside its own panels (the shell is fixed-height), not the document, so the
// browser's automatic scroll restoration has nothing useful to restore — and on iOS it races our
// custom restore during the edge-swipe-back gesture, dropping the library back to the top. Own it
// fully: every screen that cares restores its own offset.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root element not found in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
