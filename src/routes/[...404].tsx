import { type JSX, httpStatus } from '@solidjs/web';
import { Title } from '@solidjs/meta';
import { m } from '../i18n/paraglide/messages.js';

export default function NotFound(): JSX.Element {
  httpStatus(404);

  return (
    <main class="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-16 text-center">
      <Title>{m.not_found_page_title()}</Title>
      <h1>{m.not_found_title()}</h1>
      <p class="text-sm text-muted">
        {m.not_found_note()} <a href="/">{m.not_found_back()}</a>
      </p>
    </main>
  );
}
