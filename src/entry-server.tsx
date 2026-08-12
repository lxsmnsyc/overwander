// @refresh reload
import { StartServer, createHandler } from '@solidjs/start/server';
// The server keeps UTC, whatever the host machine is set to
import './server/timezone';

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {/* Where every dialog is drawn. It stands beside the app
              rather than inside it so a panel is never clipped by, or
              stacked under, whatever the page happened to build around
              the button that opened it */}
          <div id="portals" />
          {scripts}
        </body>
      </html>
    )}
  />
));
