import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { type JSX, Suspense } from 'solid-js';
import AuthProvider from './auth/context';
import registerGameData from './data';
import './app.css';

// Species, moves, items and spawn pools are inert until registered,
// and both the server render and the client hydration need them
registerGameData();

export default function App(): JSX.Element {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <AuthProvider>
            <Title>Poketerra</Title>
            {/* The same bar over every page: where the game is, and
                the two pages that are about the player rather than
                about the world */}
            <header class="border-b border-line bg-paper">
              <nav class="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
                <a href="/" class="text-base font-semibold tracking-tight no-underline">
                  Poketerra
                </a>
                <span class="grow" />
                <a href="/demo/raid" class="text-sm">
                  Raid demo
                </a>
                <a href="/login" class="text-sm">
                  Sign in
                </a>
                <a href="/profile" class="text-sm">
                  Edit profile
                </a>
              </nav>
            </header>
            <Suspense>{props.children}</Suspense>
          </AuthProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
