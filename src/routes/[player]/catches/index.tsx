import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import { For, type JSX, Show, createResource } from 'solid-js';
import { type CaughtPokemon, listCaught } from '../../../auth/caught';
import { getSpeciesData } from '../../../data/species';

/**
 * A one-line summary of a catch: the species name plus the details
 * that separate two of the same species at a glance
 */
function describeCatch(caught: CaughtPokemon): string {
  const { name } = getSpeciesData(caught.species);
  const shiny = caught.shiny ? '✦ ' : '';

  return `${shiny}${name} · Lv. ${caught.level}`;
}

export default function CatchesPage(): JSX.Element {
  const params = useParams<{ player: string }>();
  const [catches] = createResource(() => params.player, listCaught);

  return (
    <main>
      <Title>Catches - Poketerra</Title>
      <h1>Catches</h1>
      <Show when={!catches.loading} fallback={<p>Loading catches…</p>}>
        <Show when={catches()?.length} fallback={<p>No catches yet.</p>}>
          <ul>
            <For each={catches()}>
              {([id, caught]) => (
                <li>
                  <a href={`/${params.player}/catches/${id}`}>{describeCatch(caught)}</a>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>
    </main>
  );
}
