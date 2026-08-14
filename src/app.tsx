import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { type JSX, Suspense } from 'solid-js';
import AuthProvider from './auth/context';
import registerGameData from './data';
import ThemeProvider from './components/app/theme';
import { ToastProvider } from './components/styled';
import './app.css';

// Species, moves, items and spawn pools are inert until registered,
// and both the server render and the client hydration need them
registerGameData();

export default function App(): JSX.Element {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          {/* Day or night, over everything: it is a class on the root
              element, so a dialog drawn into the portals container
              beside the app is in the same theme as the app */}
          <ThemeProvider>
            <AuthProvider>
              <Title>Poketerra</Title>
              {/* No bar over the top. The game is one page — the world,
                  with what the player wants pulled over it — and a nav
                  offering to leave it was three links to two pages that
                  no longer exist and one that is a demo.

                  The toasts sit outside all of it, because what the
                  game has to say in passing is not any one screen's
                  business: a cache dug up says so over the world, and
                  it would say so over a battle too */}
              <ToastProvider>
                <Suspense>{props.children}</Suspense>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
