import { Title } from '@solidjs/meta';
import { createRouter } from '@solidjs/router';
import { Errored, Loading, type ParentProps, createEffect, onSettled } from 'solid-js';
import { HydrationScript, type JSX } from '@solidjs/web';
import { fileRoutes } from '@solidjs/router/fs';
import { pageRoutes } from 'virtual:file-routes';
import AuthProvider from './auth/context';
import ensureBattleData from './data/battle-data';
import ensureLearnSets from './data/learnset-data';
import registerWorldData from './data/world';
import ThemeProvider from './components/app/theme';
import settings, { loadSettings } from './components/app/settings';
import Announcements from './components/app/Announcements';
import { ToastProvider } from './components/styled';
import FormHost from './components/forms/FormHost';
import { ROOT_HOST } from './components/styled/portal-host';
import './app.css';
// The browser reads the locale the server rendered the page in
import { currentLocale } from './i18n/locale';

// The world is inert until it is registered, and both the server
// render and the client hydration need it before anything can be
// drawn. What a fight needs is two thirds of the data and none of it
// is read to walk around, so it is asked for rather than shipped
registerWorldData();

/** The pages under src/routes, one router for the server render and the hydration */
const Router = createRouter({ routes: fileRoutes(pageRoutes) });

/**
 * The theme, decided before anything is painted.
 *
 * The server has no idea which theme this player is in (the choice
 * lives in their browser), so the page it sends is the light one, and
 * the provider only reaches the class once the app is running. That is
 * a whole page of white thrown at somebody who chose the dark theme,
 * and it happens on every navigation.
 *
 * So the same decision is made here first, by a blocking script in the
 * head that reads the key terracotta stores under. It is written out
 * as a string because it has to run before the body exists, which is
 * earlier than any component can. `system` and a missing key both mean
 * "whatever the machine says"
 */
const THEME_SCRIPT = `
try {
  var stored = localStorage.getItem('theme-preference');
  var dark = stored === 'dark' ||
    (stored !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
} catch (error) {
  // A browser that refuses storage still gets a game, in daylight
}
`;

/**
 * The whole page around the app. Solid 2 hydrates the document, so
 * both entries render this, the client entry included
 */
export function Document(props: ParentProps): JSX.Element {
  return (
    <html lang={currentLocale()}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* The SVG for browsers that take one, the ico for those that do not */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2a75bb" />
        {/* Before the stylesheet rather than after it, so the first
            paint is already in the right theme */}
        <script innerHTML={THEME_SCRIPT} />
        <HydrationScript />
        {/* The plugin rewrites this path to the built asset in production */}
        <script type="module" src="/src/entry-client.tsx" async />
      </head>
      <body>
        {/* A render that throws still sends the page, with what went
            wrong on it, rather than a bare 500 */}
        <Errored fallback={(error) => <pre>{String(error())}</pre>}>{props.children}</Errored>
      </body>
    </html>
  );
}

export default function App(): JSX.Element {
  // After hydration rather than at import: reading storage while the
  // page is still being matched against the server's markup is what
  // makes the two disagree
  onSettled(loadSettings);

  // And the rest of the data, fetched behind the first frame rather
  // than in front of it: by the time anybody opens a bag or a sheet
  // it is usually already here, and the gates around those panels are
  // what covers the times it is not
  onSettled(() => {
    ensureLearnSets().catch(() => {
      // Same as below: the readers wait on the promise and retry it
    });
    ensureBattleData().catch(() => {
      // Nothing to do about it here: every panel that reads one of
      // those registries waits on the same promise, and a failed
      // fetch is retried the next time one is opened
    });
  });

  // The reduce-motion setting reaches CSS the way the theme does, as a
  // class on the root element. `app.css` is the other half of it
  createEffect(
    () => settings().reduceMotion,
    (reduceMotion) => {
      document.documentElement.classList.toggle('reduce-motion', reduceMotion);
    },
  );

  return (
    <Router>
      {(props) => (
        <>
          {/* Day or night, over everything: it is a class on the root
              element, so a dialog drawn into the portals container is
              in the same theme as the page it is over */}
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
                <Loading>{props.children}</Loading>
                {/* Every form and conversation, wherever it was opened from */}
                <FormHost />
                {/* What the game says to everybody sits over every
                    page, the sign-in included: "down for maintenance"
                    is most use to somebody who cannot get in */}
                <Announcements />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
          {/* Where everything that floats over the page is drawn.
              Written here rather than beside the app so it is under
              the same root as the page it covers, and last so that
              nothing the page builds around the button that opened a
              panel can clip it or stack over it. Whatever is drawn
              into it is put there by `styled/portal-host`, and a
              dialog carries a container of its own for what it floats */}
          <div id={ROOT_HOST} />
        </>
      )}
    </Router>
  );
}
