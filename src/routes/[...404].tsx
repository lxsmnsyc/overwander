import type { JSX } from 'solid-js';
import { Title } from '@solidjs/meta';
import { HttpStatusCode } from '@solidjs/start';

export default function NotFound(): JSX.Element {
  return (
    <main class="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-16 text-center">
      <Title>Not Found</Title>
      <HttpStatusCode code={404} />
      <h1>Page Not Found</h1>
      <p class="text-sm text-muted">
        Nothing is standing here. <a href="/">Back to the overworld.</a>
      </p>
    </main>
  );
}
