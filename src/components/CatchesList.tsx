import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { type CaughtPokemon, listCaught } from '../auth/caught';
import { isShiny } from '../auth/caught-record';
import { isEgg } from '../auth/egg';
import { unpackStatuses } from '../data/ids/status';
import { STATUS_NAMES, getMaxHealth, isFainted } from '../auth/health';
import { getSpeciesData } from '../data/species';
import CatchDialog from './CatchDialog';
import matches from '../core/search';
import { List, ListRow, Note, Row, RowButton, SEARCH_FROM, Search } from './styled';

/**
 * A one-line summary of a catch: the species name plus the details
 * that separate two of the same species at a glance. The auction board
 * shows a lot the same way a player sees their own pokemon
 */
export function describeCatch(caught: CaughtPokemon): string {
  // An egg is listed as an egg and nothing more: the species inside
  // is already decided, and showing it here would give it away
  if (isEgg(caught)) {
    return `Egg · ${caught.steps} / ${caught.hatchSteps} steps`;
  }

  const { name } = getSpeciesData(caught.species);
  const shiny = isShiny(caught) ? '✦ ' : '';
  // What it is carrying out of its last fight, since that is what
  // decides whether it can be brought into the next one
  const hurt =
    caught.health < getMaxHealth(caught) ? ` · ${caught.health}/${getMaxHealth(caught)} HP` : '';
  const carried = unpackStatuses(caught.statuses)
    .map((status) => ` · ${STATUS_NAMES[status]}`)
    .join('');
  const condition = isFainted(caught) ? ' · fainted' : `${hurt}${carried}`;

  return `${shiny}${name} · Lv. ${caught.level}${condition}`;
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

  /**
   * What was typed. It is matched against the same line the row shows,
   * so what a player can read they can search for: a species, a level,
   * a status, or the mark on a shiny
   */
  const [query, setQuery] = createSignal('');

  const shown = (): [string, CaughtPokemon][] =>
    (catches() ?? []).filter(([, caught]) => matches(describeCatch(caught), query()));

  return (
    <>
      {/* A handful of pokemon are read down; a box of them are looked
          through */}
      <Show when={(catches()?.length ?? 0) > SEARCH_FROM}>
        <Row>
          <Search
            placeholder="Search your pokemon"
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Row>
      </Show>

      <Show when={!catches.loading} fallback={<Note>Loading catches…</Note>}>
        <Show when={catches()?.length} fallback={<Note>No catches yet.</Note>}>
          <Show when={shown().length} fallback={<Note>Nothing here matches.</Note>}>
            <List>
              <For each={shown()}>
                {([id, caught]) => (
                  // The whole row opens the catch: a name with a button
                  // beside it would be two places to press for one thing
                  <ListRow class="p-0">
                    <RowButton
                      class="rounded-lg px-3 py-2 hover:bg-leaf-soft hover:text-ink"
                      onClick={() => {
                        setSelected(id);
                      }}
                    >
                      {describeCatch(caught)}
                    </RowButton>
                  </ListRow>
                )}
              </For>
            </List>
          </Show>
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
