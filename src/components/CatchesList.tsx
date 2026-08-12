import { type JSX, Show, createEffect, createResource, createSignal } from 'solid-js';
import { type CaughtPokemon, listCaught } from '../auth/caught';
import { isShiny } from '../auth/caught-record';
import { isEgg } from '../auth/egg';
import { unpackStatuses } from '../data/ids/status';
import { STATUS_NAMES, getMaxHealth, isFainted } from '../auth/health';
import { getSpeciesData } from '../data/species';
import CatchBoxCanvas, { BOX_SIZE, type BoxEntry } from './CatchBoxCanvas';
import matches from '../core/search';
import { Button, Meta, Note, Row, SEARCH_FROM, Search } from './styled';
import { useGame } from './game-context';

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

/**
 * How far along an egg's walk is, as a fraction. An egg written
 * before the walk existed has nowhere to be, and counts as ready
 */
function hatchProgress(caught: CaughtPokemon): number {
  return caught.hatchSteps <= 0 ? 1 : Math.min(1, caught.steps / caught.hatchSteps);
}

/**
 * A catch as a square of the box
 */
function asBoxEntry([id, caught]: [string, CaughtPokemon]): BoxEntry {
  return {
    id,
    species: caught.species,
    shiny: !isEgg(caught) && isShiny(caught),
    egg: isEgg(caught),
    progress: hatchProgress(caught),
    fainted: isFainted(caught),
    label: describeCatch(caught),
  };
}

export interface CatchesListProps {
  player: string;
}

/**
 * The player's pokemon, in boxes of thirty.
 *
 * They were a list of lines, which is what a list is for and not what
 * a collection is: a player looking for the shiny one, or for the egg
 * that is nearly out, was reading rather than looking. A box is thirty
 * squares of sprite, newest first, and pressing one opens it.
 */
export default function CatchesList(props: CatchesListProps): JSX.Element {
  const game = useGame();
  const [catches, { refetch }] = createResource(() => props.player, listCaught);

  // The sheet is opened over the whole screen rather than inside this
  // box, so what happens in it comes back the same way: a record that
  // changed bumps a counter, and this reads itself again
  createEffect(() => {
    game.records();
    Promise.resolve(refetch()).catch(() => undefined);
  });

  /**
   * What was typed. It is matched against the line the square is
   * named by, so what a player can read on a hover they can search
   * for: a species, a level, a status, or the mark on a shiny
   */
  const [query, setQuery] = createSignal('');
  const [box, setBox] = createSignal(0);

  /**
   * The whole collection, newest first. A player comes back to what
   * they just caught far more often than to what they caught in
   * March, so the first box is the recent one
   */
  const shown = (): [string, CaughtPokemon][] =>
    (catches.latest ?? [])
      .filter(([, caught]) => matches(describeCatch(caught), query()))
      .sort(([, one], [, other]) => other.caughtAt.localeCompare(one.caughtAt));

  const boxes = (): number => Math.max(1, Math.ceil(shown().length / BOX_SIZE));

  // A search that empties the last box leaves the player looking at
  // nothing; whatever they type, they end up somewhere with pokemon
  createEffect(() => {
    setBox((at) => Math.min(at, boxes() - 1));
  });

  const page = (): BoxEntry[] =>
    shown()
      .slice(box() * BOX_SIZE, (box() + 1) * BOX_SIZE)
      .map(asBoxEntry);

  return (
    <>
      <Show when={(catches.latest?.length ?? 0) > SEARCH_FROM}>
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

      {/* The box holds what it had while it re-reads. Anything done to
          a catch sends this back to the server, and a read that
          suspends takes the whole page down with it for the length of
          the round trip */}
      <Show
        when={catches.latest != null}
        fallback={<Note>{catches.loading ? 'Loading catches…' : 'No catches yet.'}</Note>}
      >
        <Show when={catches.latest?.length} fallback={<Note>No catches yet.</Note>}>
          <Show when={shown().length} fallback={<Note>Nothing here matches.</Note>}>
            <CatchBoxCanvas
              entries={page()}
              onOpen={(catchId) => {
                game.setSheet({ catchId });
              }}
            />

            {/* One box at a time, the way a box works. It appears only
                when there is more than one to go through */}
            <Show when={boxes() > 1}>
              <Row class="justify-center">
                <Button
                  disabled={box() === 0}
                  onClick={() => {
                    setBox((at) => Math.max(0, at - 1));
                  }}
                >
                  ‹
                </Button>
                <Meta>
                  Box {box() + 1} of {boxes()}
                </Meta>
                <Button
                  disabled={box() >= boxes() - 1}
                  onClick={() => {
                    setBox((at) => Math.min(boxes() - 1, at + 1));
                  }}
                >
                  ›
                </Button>
              </Row>
            </Show>
          </Show>
        </Show>
      </Show>
    </>
  );
}
