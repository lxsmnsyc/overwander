import { For, type JSX, type Resource, Show, Suspense, createResource } from 'solid-js';
import {
  CREDITS_PATH,
  type CreditedArtist,
  type Credits,
  asCredits,
  groupCredits,
} from '../../data/credits';
import { Card, Note } from '../styled';

/**
 * Who this game is built out of, read from the list rather than kept
 * beside it.
 *
 * [public/credits.json](../../../public/credits.json) is the same
 * file [docs/credits.md](../../../docs/credits.md) sends a reader to,
 * and two of its sections are written by the sprite pipeline itself.
 * So an artist who draws a pokemon or a charset reaches this screen
 * without anybody remembering to type their name in twice.
 */

/** The list, fetched once and shared by everything that asks. */
let listed: Promise<Credits> | null = null;

// Not async: it hands back the one promise everything shares, and
// awaiting it here would make a second
// oxlint-disable-next-line typescript/promise-function-async
function loadCredits(): Promise<Credits> {
  listed ??= fetch(CREDITS_PATH)
    .then(async (response) => asCredits(await response.json()))
    .catch(() => asCredits(null));

  return listed;
}

/** A path as a person reads it: the pack it is in and its name. */
function sheetName(work: string): string {
  const parts = work.split('/');

  return parts.slice(-2).join('/');
}

/**
 * One artist and what of theirs ships. The works are named rather
 * than counted: a credits page that said "296 pokemon" would be
 * counting the work instead of crediting it
 */
function Artist(props: { artist: CreditedArtist; name?: (work: string) => string }): JSX.Element {
  const named = (): string =>
    props.artist.works.map((work) => props.name?.(work) ?? work).join(', ');

  return (
    <li class="flex flex-col gap-0.5 border-b border-line-soft pb-2 last:border-b-0">
      <span class="text-sm font-semibold">{props.artist.name}</span>
      <span class="text-xs text-muted">{named()}</span>
    </li>
  );
}

function Artists(props: {
  artists: CreditedArtist[];
  name?: (work: string) => string;
}): JSX.Element {
  return (
    <ul class="m-0 flex list-none flex-col gap-2 p-0">
      <For each={props.artists}>{(artist) => <Artist artist={artist} name={props.name} />}</For>
    </ul>
  );
}

/**
 * The cards themselves. Its own component because a resource read in
 * the body that declared it throws past every boundary written there
 */
function CreditsList(props: { credits: Resource<Credits> }): JSX.Element {
  const held = (): Credits => props.credits() ?? asCredits(null);

  const packages = (kind: 'runtime' | 'build'): Credits['packages'] =>
    held().packages.filter((one) => one.kind === kind);

  return (
    <>
      <Card title="Where the art comes from">
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          <For each={held().sources}>
            {(source) => (
              <li class="flex flex-col gap-0.5 border-b border-line-soft pb-2 last:border-b-0">
                <span class="text-sm font-semibold">{source.what}</span>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  class="text-sm text-tide-dark underline"
                >
                  {source.who}
                </a>
                <span class="text-xs text-muted">{source.terms}</span>
              </li>
            )}
          </For>
        </ul>
      </Card>

      <Card title="Pokemon sprites">
        <p class="max-w-prose text-sm text-muted">
          Everybody named on a sheet that ships, and the pokemon they drew.
        </p>
        <Artists artists={groupCredits(held().sprites)} />
      </Card>

      <Card title="Overworld characters">
        <Artists artists={groupCredits(held().overworld)} name={sheetName} />
      </Card>

      <Show when={held().scenery.length > 0}>
        <Card title="Landmarks, decorations and trees">
          <p class="max-w-prose text-sm text-muted">
            Names alone: which of them drew which tile was never written down.
          </p>
          <p class="max-w-prose text-sm">{held().scenery.join(', ')}</p>
        </Card>
      </Show>

      <Card title="Libraries">
        <p class="max-w-prose text-sm text-muted">What ships in the game.</p>
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          <For each={packages('runtime')}>
            {(one) => (
              <li class="flex flex-col gap-0.5 border-b border-line-soft pb-2 last:border-b-0">
                <span class="text-sm font-semibold">{one.name}</span>
                <span class="text-xs text-muted">
                  {one.what} · {one.licence}
                </span>
              </li>
            )}
          </For>
        </ul>
        <p class="max-w-prose text-sm text-muted">
          And what only builds it:{' '}
          {packages('build')
            .map((one) => one.name)
            .join(', ')}
          .
        </p>
      </Card>
    </>
  );
}

export default function CreditsCard(): JSX.Element {
  const [credits] = createResource(loadCredits);

  return (
    <Suspense
      fallback={
        <Card title="Credits">
          <Note>Reading the credits…</Note>
        </Card>
      }
    >
      <CreditsList credits={credits} />
    </Suspense>
  );
}
