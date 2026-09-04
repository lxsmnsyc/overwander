import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { type JSX, Suspense, createEffect, onMount } from 'solid-js';
import AuthProvider from './auth/context';
import ensureBattleData from './data/battle-data';
import registerWorldData from './data/world';
import ThemeProvider from './components/app/theme';
import settings, { loadSettings } from './components/app/settings';
import { ToastProvider } from './components/styled';
import './app.css';

// The world is inert until it is registered, and both the server
// render and the client hydration need it before anything can be
// drawn. What a fight needs is two thirds of the data and none of it
// is read to walk around, so it is asked for rather than shipped
registerWorldData();

export default function App(): JSX.Element {
  // After hydration rather than at import: reading storage while the
  // page is still being matched against the server's markup is what
  // makes the two disagree
  onMount(loadSettings);

  // And the rest of the data, fetched behind the first frame rather
  // than in front of it: by the time anybody opens a bag or a sheet
  // it is usually already here, and the gates around those panels are
  // what covers the times it is not
  onMount(() => {
    ensureBattleData().catch(() => {
      // Nothing to do about it here: every panel that reads one of
      // those registries waits on the same promise, and a failed
      // fetch is retried the next time one is opened
    });
  });

  // The reduce-motion setting reaches CSS the way the theme does, as a
  // class on the root element. `app.css` is the other half of it
  createEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', settings().reduceMotion);
  });

  return (
    <Router
      root={(props) => (
        <MetaProvider>
          {/* Day or night, over everything: it is a class on the root
              element, so a dialog drawn into the portals container
              beside the app is in the same theme as the app */}
          <ThemeProvider>
            <AuthProvider>
              <Title>Overwander</Title>
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
