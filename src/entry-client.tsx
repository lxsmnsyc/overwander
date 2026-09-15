// @refresh reload
import { StartClient, mount } from '@solidjs/start/client';
import guardServerCalls from './utils/stale-build';

// Before anything can call the server
guardServerCalls();

mount(() => <StartClient />, document.getElementById('app')!);
