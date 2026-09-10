// @refresh reload
import { StartServer, createHandler } from '@solidjs/start/server';
// The server keeps UTC, whatever the host machine is set to
import './server/timezone';

/**
 * The theme, decided before anything is painted.
 *
 * The server has no idea which theme this player is in — the choice
 * lives in their browser — so the page it sends is the light one, and
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

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {/* Before the stylesheet rather than after it, so the first
              paint is already in the right theme */}
          <script innerHTML={THEME_SCRIPT} />
          {assets}
        </head>
        <body>
          {/* Everything that floats over the page is drawn into a
              container of the app's own, which it draws at the end of
              this one: written in here instead, it would be thrown
              away the moment the app hydrated */}
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
