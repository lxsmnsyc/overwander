import type { JSX } from 'solid-js';
import { Title } from '@solidjs/meta';
import { HttpStatusCode } from '@solidjs/start';
import { m } from '../i18n/paraglide/messages.js';

export default function NotFound(): JSX.Element {
  return (
    <main class="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-16 text-center">
      <Title>{m.not_found_page_title()}</Title>
      <HttpStatusCode code={404} />
      <h1>{m.not_found_title()}</h1>
      <p class="text-sm text-muted">
        {m.not_found_note()} <a href="/">{m.not_found_back()}</a>
      </p>
    </main>
  );
}
