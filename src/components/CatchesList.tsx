import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { type CaughtPokemon, listCaught } from '../auth/caught';
import { getSpeciesData } from '../data/species';
import CatchDialog from './CatchDialog';

/**
 * A one-line summary of a catch: the species name plus the details
 * that separate two of the same species at a glance
 */
function describeCatch(caught: CaughtPokemon): string {
  const { name } = getSpeciesData(caught.species);
  const shiny = caught.shiny ? '✦ ' : '';

  return `${shiny}${name} · Lv. ${caught.level}`;
}

export interface CatchesListProps {
  player: string;
}

/**
 * The player's catches. Selecting one opens it in a dialog rather
 * than navigating away, so the list stays where it was
 */
export default function CatchesList(props: CatchesListProps): JSX.Element {
  const [catches, { refetch }] = createResource(() => props.player, listCaught);
  const [selected, setSelected] = createSignal<string | null>(null);

  return (
    <>
      <Show when={!catches.loading} fallback={<p>Loading catches…</p>}>
        <Show when={catches()?.length} fallback={<p>No catches yet.</p>}>
          <ul>
            <For each={catches()}>
              {([id, caught]) => (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(id);
                    }}
                  >
                    {describeCatch(caught)}
                  </button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>

      <CatchDialog
        player={props.player}
        catchId={selected()}
        onClose={() => {
          setSelected(null);
        }}
        onChange={() => {
          // An evolution renames the entry behind the dialog. A
          // failed refetch leaves the last good list in place; the
          // dialog already reported whatever went wrong
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </>
  );
}
