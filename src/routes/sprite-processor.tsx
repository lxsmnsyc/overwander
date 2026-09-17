import { A } from '@solidjs/router';
import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';
import SpriteProcessor from '../components/sprite-processor';
import { ThemeToggle } from '../components/app/theme';

/**
 * The sprite processor, on its own page and behind nothing.
 *
 * It is a tool for whoever is running the repository rather than a
 * screen of the game: it writes into the working tree, so it only
 * works on a development build, and on one of those the person at the
 * keyboard already owns every file it could write. Asking them to sign
 * in as an admin first bought nothing.
 */
export default function SpriteProcessorPage(): JSX.Element {
  return (
    <>
      <Title>Sprite processor · Overwander</Title>
      <div class="mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
        <header
          class="flex flex-wrap items-center gap-3 border-b-2 border-line bg-paper px-4 py-3
            shadow-pop-sm"
        >
          <div class="min-w-0 grow">
            <h1>Sprite Processor</h1>
            <p class="max-w-prose text-sm text-muted">
              Pack loose images, a charset or a tileset into a sheet, written straight into public/.
            </p>
          </div>
          <A href="/" class="text-sm font-bold">
            The game
          </A>
          <ThemeToggle />
        </header>

        <main class="grow px-4 py-4">
          <SpriteProcessor />
        </main>
      </div>
    </>
  );
}
