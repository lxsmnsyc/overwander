import { type JSX, Show, createEffect, createResource, createSignal } from 'solid-js';
import { getPokedex } from '../../auth/pokedex';
import type { Species } from '../../data/ids/species';
import { getBaseForms, getSpeciesData } from '../../data/species';
import PokedexCanvas, { DEX_PAGE, type DexEntry, dexLabel } from './PokedexCanvas';
import { Badge, Button, Meta, Note, Panel, Row } from '../styled';
import { useGame } from '../app/game-context';

/**
 * Every pokemon there is, and how much of each one the player has
 * earned the right to see.
 *
 * It is the whole registry rather than what has been met: a dex with
 * only the found ones in it is a list of achievements, and the thing
 * that makes a dex worth opening is the gaps — the shape of what is
 * still out there, in the order it will be filled in.
 *
 * **Base forms only.** A dex is one row per pokemon rather than one
 * per costume, which is the same rule the game counts a dex by
 * (`getBaseForms`); a form is something to show on the entry of the
 * species it belongs to.
 */
export interface PokedexTabProps {
  player: string;
}

export default function PokedexTab(props: PokedexTabProps): JSX.Element {
  const game = useGame();

  // Re-read whenever anything the player owns changes: catching one is
  // the whole point, and a dex that needed reopening to notice would
  // be the one screen in the game that lies about what just happened
  const [dex] = createResource(
    () => [props.player, game.records()] as const,
    async ([player]) => getPokedex(player),
  );

  const entries = (): DexEntry[] => {
    // `latest` rather than the resource: a read that suspends unmounts
    // the panel and takes the page under it down with it
    const view = dex.latest;
    const seen = new Set(view?.seen.map((tally) => tally.species) ?? []);
    const caught = new Set(view?.caught.map((tally) => tally.species) ?? []);

    return getBaseForms()
      .map((species): DexEntry => {
        const data = getSpeciesData(species);

        return {
          species,
          dexNumber: data.dexNumber,
          name: data.name,
          seen: seen.has(species),
          caught: caught.has(species),
        };
      })
      .sort((one, other) => one.dexNumber - other.dexNumber);
  };

  const open = (species: Species): void => {
    game.setDexEntry(species);
  };

  /**
   * Which page of thirty is showing. The dex is read a box at a time
   * the way the collection is, so a species is always in the same
   * square of the same page — which is what makes it findable by
   * looking rather than by reading every number
   */
  const [page, setPage] = createSignal(0);

  const pages = (): number => Math.max(1, Math.ceil(entries().length / DEX_PAGE));

  // The registry cannot shrink under a running game, but a page beyond
  // the end would draw an empty box; this is the same guard the catch
  // picker keeps for a search that empties its last box
  createEffect(() => {
    setPage((at) => Math.min(at, pages() - 1));
  });

  const shown = (): DexEntry[] => entries().slice(page() * DEX_PAGE, (page() + 1) * DEX_PAGE);

  /**
   * What the page is called: the numbers it holds rather than "page 2
   * of 6". A dex is addressed by its numbers, and #031–#060 is where a
   * player already knows Nidoran lives
   */
  const span = (): string => {
    const listed = shown();
    const first = listed.at(0);
    const last = listed.at(-1);

    return first == null || last == null
      ? ''
      : `${dexLabel(first.dexNumber)} – ${dexLabel(last.dexNumber)}`;
  };

  return (
    <Panel>
      {/* The two figures a dex is kept for, over the squares that
          explain them */}
      <Row class="justify-center">
        <Badge tone="tide">{dex.latest?.seenSpecies ?? 0} seen</Badge>
        <Badge tone="leaf">{dex.latest?.caughtSpecies ?? 0} caught</Badge>
        <Badge>of {entries().length}</Badge>
      </Row>

      {/* Thirty at a time, addressed by the numbers on the page.
          Above the squares rather than under them: five rows of six
          fill a laptop screen on their own, and paging buttons below
          them are buttons a player has to scroll to reach */}
      <Row class="justify-center">
        <Button
          label="Earlier pokemon"
          disabled={page() === 0}
          onClick={() => {
            setPage((at) => Math.max(0, at - 1));
          }}
        >
          ‹
        </Button>
        <Meta>{span()}</Meta>
        <Button
          label="Later pokemon"
          disabled={page() >= pages() - 1}
          onClick={() => {
            setPage((at) => Math.min(pages() - 1, at + 1));
          }}
        >
          ›
        </Button>
      </Row>

      <Show when={dex.latest != null} fallback={<Note>Reading the dex…</Note>}>
        <PokedexCanvas entries={shown()} onOpen={open} />
      </Show>
    </Panel>
  );
}
