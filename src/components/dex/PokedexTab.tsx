import {
  For,
  type JSX,
  type Resource,
  Suspense,
  createEffect,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import Regions from '../../data/ids/regions';
import { REGIONS, REGION_NAMES, getRegionSpan, getSpeciesRegion } from '../../data/species/regions';
import { type PokedexView, getPokedex } from '../../auth/pokedex';
import { ArrowLeftIcon, ArrowRightIcon } from '../icons';
import type { Species } from '../../data/ids/species';
import { getBaseFormSpecies } from '../../data/ids/species';
import { getBaseForms, getSpeciesData, getSpeciesForms } from '../../data/species';
import PokedexGrid, { DEX_PAGE, type DexEntry, dexLabel } from './PokedexGrid';
import { Badge, Button, Meta, Note, Panel, Row, TextField } from '../styled';
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
 * **Default forms only.** A dex is one row per pokemon rather than one
 * per costume, which is the same rule the game counts a dex by
 * (`getBaseForms`). A row with several forms behind it lights up from
 * any of them and opens the forms grid rather than an entry.
 */
export interface PokedexTabProps {
  player: string;
}

/**
 * The dex as a box of squares, which is where the record is read.
 *
 * A dex read in the body that declared it throws past every
 * `Suspense` written there and lands on the boundary around the whole
 * page, so the reading half is its own component
 */
type DexFilter = 'all' | 'caught' | 'missing';

const FILTERS: [DexFilter, string][] = [
  ['all', 'All'],
  ['caught', 'Caught'],
  ['missing', 'Missing'],
];

const FILTER_CHIP = `cursor-pointer rounded-full border-2 border-line bg-paper px-3 py-1 text-xs
  font-bold text-ink shadow-none transition-colors hover:border-tide active:translate-y-0
  aria-checked:border-tide-dark aria-checked:bg-tide aria-checked:text-on-accent
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide`;

interface RegionTally {
  region: Regions;
  /** The region's first dex number, where pressing its chip turns to */
  first: number;
  total: number;
  seen: number;
  caught: number;
}

/** A region's name for reading; the stored one is lower case for the sheet folders */
function regionName(region: Regions): string {
  const name = REGION_NAMES[region];

  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function PokedexBox(props: { dex: Resource<PokedexView> }): JSX.Element {
  const game = useGame();

  const entries = (): DexEntry[] => {
    const view = props.dex();
    // Rolled up to the form's own entry: the dex prints one Unown, and
    // an Unown B in the record is that row filled in
    const seen = new Set<Species>();
    const caught = new Set<Species>();

    for (const tally of view?.seen ?? []) {
      seen.add(getBaseFormSpecies(tally.species));
    }
    for (const tally of view?.caught ?? []) {
      caught.add(getBaseFormSpecies(tally.species));
    }

    const rows: DexEntry[] = [];

    for (const species of getBaseForms()) {
      const data = getSpeciesData(species);

      rows.push({
        species,
        dexNumber: data.dexNumber,
        name: data.name,
        seen: seen.has(species),
        caught: caught.has(species),
      });
    }
    return rows.sort((one, other) => one.dexNumber - other.dexNumber);
  };

  /**
   * A row with one form opens its entry; a row with several asks which
   * form first, since the row stands for the pokemon rather than for
   * any one of its costumes
   */
  const open = (species: Species): void => {
    if (getSpeciesForms(species).length > 1) {
      game.setDexForms(species);
    } else {
      game.setDexEntry(species);
    }
  };

  /**
   * Which page of thirty is showing. The dex is read a box at a time
   * the way the collection is, so a species is always in the same
   * square of the same page — which is what makes it findable by
   * looking rather than by reading every number
   */
  /** Which squares the page draws from: everything, what is owned, or what is still to catch */
  const [filter, setFilter] = createSignal<DexFilter>('all');
  const [query, setQuery] = createSignal('');

  /** A number typed into the search, which finds a page rather than narrowing the list */
  const asked = (): number | null => {
    const typed = query().trim().replace(/^#/, '');

    return /^\d+$/.test(typed) ? Number(typed) : null;
  };

  const listed = createMemo((): DexEntry[] => {
    const wanted = query().trim().toLowerCase();
    const byName = wanted !== '' && asked() == null;
    const rows: DexEntry[] = [];

    for (const entry of entries()) {
      if (filter() === 'caught' && !entry.caught) {
        continue;
      }
      if (filter() === 'missing' && entry.caught) {
        continue;
      }
      // Only a name already met can be found by name, so the search never gives one away
      if (byName && !((entry.seen || entry.caught) && entry.name.toLowerCase().includes(wanted))) {
        continue;
      }
      rows.push(entry);
    }
    return rows;
  });

  const [page, setPage] = createSignal(0);

  const pages = (): number => Math.max(1, Math.ceil(listed().length / DEX_PAGE));

  // A narrower list can leave the page past its end
  createEffect(() => {
    setPage((at) => Math.min(at, pages() - 1));
  });

  /** Turn to the page holding the first entry at or past this dex number */
  const turnTo = (dexNumber: number): void => {
    for (const [at, entry] of listed().entries()) {
      if (entry.dexNumber >= dexNumber) {
        setPage(Math.floor(at / DEX_PAGE));
        return;
      }
    }
  };

  createEffect(() => {
    const number = asked();

    if (number != null) {
      turnTo(number);
    }
  });

  const highlight = (): Species | null => {
    const number = asked();

    if (number == null) {
      return null;
    }
    for (const entry of listed()) {
      if (entry.dexNumber === number) {
        return entry.species;
      }
    }
    return null;
  };

  const shown = (): DexEntry[] => listed().slice(page() * DEX_PAGE, (page() + 1) * DEX_PAGE);

  /** Each region with any species registered: how many there are, and how many are met and owned */
  const regions = createMemo(() => {
    const tallies: RegionTally[] = [];

    for (const region of REGIONS) {
      if (region === Regions.Unknown) {
        continue;
      }
      const span = getRegionSpan(region);
      const tally: RegionTally = { region, first: span?.[0] ?? 0, total: 0, seen: 0, caught: 0 };

      for (const entry of entries()) {
        if (getSpeciesRegion(entry.species) === region) {
          tally.total += 1;
          tally.seen += entry.seen || entry.caught ? 1 : 0;
          tally.caught += entry.caught ? 1 : 0;
        }
      }
      if (tally.total > 0) {
        tallies.push(tally);
      }
    }
    return tallies;
  });

  const span = (): string => {
    const onPage = shown();
    const first = onPage.at(0);
    const last = onPage.at(-1);

    if (first == null || last == null) {
      return 'Nothing here';
    }
    return `${dexLabel(first.dexNumber)} – ${dexLabel(last.dexNumber)} · ${regionName(
      getSpeciesRegion(first.species),
    )}`;
  };

  return (
    <Panel>
      <Row class="justify-center">
        <Badge tone="tide">{props.dex()?.seenSpecies ?? 0} seen</Badge>
        <Badge tone="leaf">{props.dex()?.caughtSpecies ?? 0} caught</Badge>
        <Badge>of {entries().length}</Badge>
      </Row>

      {/* A chip per region: seen out of how many, with the caught share as a bar under it */}
      <div class="flex flex-wrap justify-center gap-1.5">
        <For each={regions()}>
          {(tally) => (
            <button
              type="button"
              class="flex cursor-pointer flex-col gap-1 rounded-xl border-2 border-line bg-paper px-2.5
                py-1 text-left text-xs font-bold text-ink shadow-pop-sm transition-colors
                hover:border-tide active:translate-y-0 focus-visible:outline-2
                focus-visible:outline-offset-2 focus-visible:outline-tide"
              aria-label={`${regionName(tally.region)}: ${tally.seen} of ${tally.total} seen, ${tally.caught} caught`}
              onClick={() => {
                turnTo(tally.first);
              }}
            >
              <span>
                {regionName(tally.region)}{' '}
                <span class="font-normal text-muted tabular-nums">
                  {tally.seen}/{tally.total}
                </span>
              </span>
              <span class="block h-1 overflow-hidden rounded-full bg-line-soft">
                <span
                  class="block h-full rounded-full bg-leaf"
                  style={{ width: `${(tally.caught / tally.total) * 100}%` }}
                />
              </span>
            </button>
          )}
        </For>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
        <TextField
          class="grow"
          label="Find"
          placeholder="A number, or the name of one you have met"
          value={query()}
          onChange={(typed) => {
            setQuery(typed);
          }}
        />
        <div role="radiogroup" aria-label="Show" class="flex shrink-0 gap-1">
          <For each={FILTERS}>
            {([value, said]) => (
              <button
                type="button"
                role="radio"
                aria-checked={filter() === value}
                class={FILTER_CHIP}
                onClick={() => {
                  setFilter(value);
                }}
              >
                {said}
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Above the squares: five rows of six fill a laptop screen, and
          paging under them is paging a player has to scroll to reach */}
      <Row class="justify-center">
        <Button
          label="Earlier pokemon"
          disabled={page() === 0}
          onClick={() => {
            setPage((at) => Math.max(0, at - 1));
          }}
        >
          <ArrowLeftIcon class="size-4" aria-hidden="true" />
        </Button>
        <Meta class="tabular-nums">{span()}</Meta>
        <Button
          label="Later pokemon"
          disabled={page() >= pages() - 1}
          onClick={() => {
            setPage((at) => Math.min(pages() - 1, at + 1));
          }}
        >
          <ArrowRightIcon class="size-4" aria-hidden="true" />
        </Button>
      </Row>

      <PokedexGrid entries={shown()} onOpen={open} highlight={highlight()} />
    </Panel>
  );
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

  return (
    <Suspense
      fallback={
        <Panel>
          <Note>Reading the dex…</Note>
        </Panel>
      }
    >
      <PokedexBox dex={dex} />
    </Suspense>
  );
}
