import type { StartServerRenderContext } from '@solidjs/vite-plugin';
import { getRequestEvent, renderToStream } from '@solidjs/web';
import manifest from 'virtual:solid-manifest';
// The server keeps UTC, whatever the host machine is set to
import './server/timezone';
// Each request is rendered in the locale it asks for
import './i18n/server';
import App, { Document } from './app';

/** The page for one request, streamed. The plugin points the client entry at the built asset */
// oxlint-disable-next-line import/prefer-default-export -- the plugin calls a named `render`
export function render(
  _request: Request,
  context: StartServerRenderContext,
): ReturnType<typeof renderToStream> {
  return renderToStream(
    () => (
      <Document>
        <App />
      </Document>
    ),
    { manifest, nonce: context.nonce, signal: getRequestEvent()?.request.signal },
  );
}
