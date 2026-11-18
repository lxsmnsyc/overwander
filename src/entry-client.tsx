import { hydrate } from '@solidjs/web';
import App, { Document } from './app';
import guardServerCalls from './auth/stale-build';

// Before anything can call the server
guardServerCalls();

hydrate(
  () => (
    <Document>
      <App />
    </Document>
  ),
  document,
);
