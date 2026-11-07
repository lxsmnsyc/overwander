import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import Regions from '../../data/ids/regions';
import { REGIONS, getRegionSpan, getSpeciesRegion } from '../../data/species/regions';
import { type PokedexView, getPokedex } from '../../auth/pokedex';
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon, StarIcon } from '../icons';
import { Species } from '../../data/ids/species';
import { getBaseFormSpecies } from '../../data/ids/forms';
import { getBaseForms, getSpeciesData, getSpeciesForms } from '../../data/species';
import PokedexGrid, {
  DEX_PAGE,
  type DexEntry,
  FormsMark,
  SILHOUETTE,
  dexLabel,
} from './PokedexGrid';
import AnimatedSprite from '../sprites/AnimatedSprite';
import { Button, Note, RAIL, Segmented, type SegmentedOption, TextField, railRow } from '../styled';
import { formatNumber } from '../../i18n/format';
import { useGame } from '../app/game-context';
import { m } from '../../i18n/paraglide/messages.js';

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

const FILTERS: [DexFilter, () => string][] = [
  ['all', m.item_pocket_all],
  ['caught', m.dex_filter_caught],
  ['missing', m.dex_filter_missing],
];

/** Who stands in the key's squares: any species reads, so the best known one */
const KEY_SPECIES = Species.Pikachu;

/** The filters as the segmented control lists them */
function listFilters(): SegmentedOption<DexFilter>[] {
  const options: SegmentedOption<DexFilter>[] = [];

  for (const [value, said] of FILTERS) {
    options.push({ value, label: said() });
  }
  return options;
}

/** One of the two counts at the top of the rail: a number over its word */
function CountTile(props: { count: number; label: string; tone: 'tide' | 'leaf' }): JSX.Element {
  return (
    <div
      class={`flex min-w-0 flex-1 flex-col gap-0.5 rounded-card border-2 px-3 py-2 ${
        props.tone === 'tide' ? 'border-tide/30' : 'border-leaf/30'
      }`}
    >
      <b
        class={`font-display text-2xl leading-none font-semibold tabular-nums ${
          props.tone === 'tide' ? 'text-tide' : 'text-leaf'
        }`}
      >
        {formatNumber(props.count)}
      </b>
      <span class="text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase">
        {props.label}
      </span>
    </div>
  );
}

/**
 * One square of the key under the grid, drawn as a small dex square:
 * the same frame, and the same sprite or silhouette the squares carry
 */
function KeySwatch(props: { look: 'caught' | 'seen' | 'unmet'; label: string }): JSX.Element {
  return (
    <span class="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        class={`relative size-5 overflow-hidden rounded-[5px] border ${
          props.look === 'unmet' ? 'border-line/70 bg-line-soft' : 'border-line bg-paper'
        }`}
      >
        <Show when={props.look !== 'unmet'}>
          <span class="absolute inset-0.5">
            <AnimatedSprite
              species={KEY_SPECIES}
              direction="DownLeft"
              still
              fill
              class={props.look === 'seen' ? SILHOUETTE : ''}
            />
          </span>
        </Show>
      </span>
      {props.label}
    </span>
  );
}

interface RegionTally {
  region: Regions;
  /** The region's first dex number, where pressing its chip turns to */
  first: number;
  total: number;
  seen: number;
  caught: number;
}

/** What each region is called, as the games name it in the player's language */
const REGION_LABELS: Record<Regions, () => string> = {
  [Regions.Unknown]: m.dex_region_unknown,
  [Regions.Kanto]: m.dex_region_kanto,
  [Regions.Johto]: m.dex_region_johto,
  [Regions.Hoenn]: m.dex_region_hoenn,
  [Regions.Sinnoh]: m.dex_region_sinnoh,
  [Regions.Unova]: m.dex_region_unova,
  [Regions.Kalos]: m.dex_region_kalos,
  [Regions.Alola]: m.dex_region_alola,
  [Regions.Galar]: m.dex_region_galar,
  [Regions.Hisui]: m.dex_region_hisui,
  [Regions.Paldea]: m.dex_region_paldea,
};

/** A region's name for reading */
function regionName(region: Regions): string {
  return REGION_LABELS[region]();
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
        forms: getSpeciesForms(species).length > 1,
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
      return m.dex_nothing_here();
    }
    return `${dexLabel(first.dexNumber)} – ${dexLabel(last.dexNumber)} · ${regionName(
      getSpeciesRegion(first.species),
    )}`;
  };

  /** The region the page showing starts in, lit in the rail */
  const here = (): Regions | null => {
    const first = shown().at(0);

    return first == null ? null : getSpeciesRegion(first.species);
  };

  return (
    <div class="flex w-full flex-col gap-3 md:flex-row md:items-stretch md:gap-5">
      {/* The rail: what has been met and owned, then every region as a
          way into the dex with how much of it is caught. A row of chips
          on a phone */}
      <div class="flex shrink-0 flex-col gap-2.5 md:w-[13.75rem]">
        <div class="flex gap-1.5">
          <CountTile count={props.dex()?.seenSpecies ?? 0} label={m.dex_tile_seen()} tone="tide" />
          <CountTile
            count={props.dex()?.caughtSpecies ?? 0}
            label={m.dex_tile_caught()}
            tone="leaf"
          />
        </div>
        <span class="-mt-1 text-xs text-muted">{m.dex_of({ count: entries().length })}</span>
        <nav aria-label={m.dex_regions()} class={`${RAIL} md:grow`}>
          <For each={regions()}>
            {(tally) => (
              <button
                type="button"
                aria-current={here() === tally.region ? 'page' : undefined}
                class={`${railRow(here() === tally.region)} md:flex-col md:items-stretch md:gap-1
                  md:py-1.5`}
                aria-label={m.dex_region_label({
                  region: regionName(tally.region),
                  seen: tally.seen,
                  total: tally.total,
                  caught: tally.caught,
                })}
                onClick={() => {
                  turnTo(tally.first);
                }}
              >
                <span class="flex w-full items-baseline gap-1.5">
                  <span class="truncate">{regionName(tally.region)}</span>
                  {/* Proposal, approved: a star on a region with everything caught */}
                  <Show when={tally.caught === tally.total}>
                    <StarIcon
                      aria-hidden="true"
                      class="size-3.5 shrink-0 self-center fill-current text-gold"
                    />
                  </Show>
                  <span class="ml-auto shrink-0 font-display text-xs font-semibold text-muted tabular-nums">
                    {formatNumber(tally.seen)}/{formatNumber(tally.total)}
                  </span>
                </span>
                <span class="hidden h-[5px] w-full overflow-hidden rounded-full bg-line-soft md:block">
                  <span
                    class="block h-full rounded-full bg-leaf"
                    style={{ width: `${(tally.caught / tally.total) * 100}%` }}
                  />
                </span>
              </button>
            )}
          </For>
        </nav>
      </div>

      <div class="flex min-w-0 grow flex-col gap-2.5">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <TextField
            class="min-w-0 grow"
            kind="search"
            label={m.dex_find()}
            quietLabel
            leading={<SearchIcon class="size-4" aria-hidden="true" />}
            placeholder={m.dex_find_placeholder()}
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
          <Segmented
            label={m.dex_show()}
            value={filter()}
            options={listFilters()}
            onChange={(value) => {
              setFilter(value);
            }}
          />
        </div>

        {/* Above the squares: five rows of six fill a laptop screen, and
            paging under them is paging a player has to scroll to reach */}
        <div class="flex items-center gap-2.5">
          <Button
            class="size-10 shrink-0 justify-center px-0"
            label={m.dex_earlier()}
            disabled={page() === 0}
            onClick={() => {
              setPage((at) => Math.max(0, at - 1));
            }}
          >
            <ArrowLeftIcon class="size-4" aria-hidden="true" />
          </Button>
          <span class="min-w-0 grow truncate text-center font-display text-base font-semibold tabular-nums">
            {span()}
          </span>
          <Button
            class="size-10 shrink-0 justify-center px-0"
            label={m.dex_later()}
            disabled={page() >= pages() - 1}
            onClick={() => {
              setPage((at) => Math.min(pages() - 1, at + 1));
            }}
          >
            <ArrowRightIcon class="size-4" aria-hidden="true" />
          </Button>
        </div>

        <PokedexGrid entries={shown()} onOpen={open} highlight={highlight()} fill />

        {/* What the three kinds of square mean, and the forms mark */}
        <div class="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-muted">
          <KeySwatch look="caught" label={m.dex_key_caught()} />
          <KeySwatch look="seen" label={m.dex_key_seen()} />
          <KeySwatch look="unmet" label={m.dex_key_unmet()} />
          <span class="inline-flex items-center gap-1.5 text-tide-dark">
            <FormsMark class="size-3.5" />
            {m.dex_key_forms()}
          </span>
        </div>
      </div>
    </div>
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
    <Suspense fallback={<Note>{m.dex_loading()}</Note>}>
      <PokedexBox dex={dex} />
    </Suspense>
  );
}
