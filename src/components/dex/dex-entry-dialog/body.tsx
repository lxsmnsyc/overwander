import type { PokedexView, SpeciesDexEntry } from '../../../auth/pokedex';
import type { Species } from '../../../data/ids/species';
import { type SpeciesData, getSpeciesData } from '../../../data/species';
import { Note } from '../../styled';
import { type JSX, type Resource, Show, createEffect, createSignal, on } from 'solid-js';
import { answered } from '../../app/resource-reads';
import Abilities from './sections/Abilities';
import BaseStats from './sections/BaseStats';
import EvolutionLine, { type DexKnows } from './sections/EvolutionLine';
import Facts from './sections/Facts';
import Habitat from './sections/Habitat';
import MoveLists from './sections/MoveLists';
import Portrait from './sections/Portrait';
import { m } from '../../../i18n/paraglide/messages.js';

export interface DexEntryDialogProps {
  /**
   * Whose dex is being read. What has been met and what candy is held
   * are the two things on this page that belong to the reader rather
   * than to the species
   */
  player: string;
  /**
   * The species, or null when the entry is shut
   */
  species: Species | null;
  onClose: () => void;
  /**
   * Open a different entry: the one before this one in the dex, or
   * the one after it
   */
  onSpecies: (species: Species) => void;
  /**
   * Where the reader's dex and candy come from. Left out, they are the
   * player's own; a demo hands in made-up answers instead
   */
  reads?: DexReads;
}

/** The three things an entry reads about its reader */
export interface DexReads {
  entry: (player: string, species: Species) => SpeciesDexEntry | Promise<SpeciesDexEntry>;
  candy: (player: string, species: Species) => number | Promise<number>;
  pokedex: (player: string) => PokedexView | Promise<PokedexView>;
}

/**
 * The entry itself, which is where the dex and the candy are read.
 *
 * Either read in the body that declared it would throw past every
 * `Suspense` written there and land on the boundary around the page,
 * taking the dialog with it, so the reading half stands on its own
 */
export function DexEntryBody(
  props: DexEntryDialogProps & {
    dex: Resource<SpeciesDexEntry | null>;
    candy: Resource<number>;
    /** Whether this species was drawn a second time for its females. */
    female: Resource<boolean>;
    /** The reader's whole dex, for drawing the rest of the line */
    pokedex: Resource<PokedexView>;
  },
): JSX.Element {
  /**
   * The species and its data together, so everything below can be
   * written against one non-null thing rather than checking twice
   */
  const showing = (): { species: Species; data: SpeciesData } | null => {
    const species = props.species;

    return species == null ? null : { species, data: getSpeciesData(species) };
  };

  const known = (): {
    met: boolean;
    owned: boolean;
    shiny: boolean;
    seen: number;
    caught: number;
  } => {
    const entry = props.dex();

    if (entry == null || entry.species !== props.species) {
      return { met: false, owned: false, shiny: false, seen: 0, caught: 0 };
    }
    return {
      met: entry.met,
      owned: entry.owned,
      shiny: entry.shiny,
      // How many, rather than whether: a dex is kept as much for the
      // hundredth Pidgey as for the first
      seen: entry.seen.total,
      caught: entry.caught.total,
    };
  };

  /** Which coat the portrait shows. Both reset when the entry turns to another species */
  const [shiny, setShiny] = createSignal(false);
  const [female, setFemale] = createSignal(false);

  createEffect(
    on(
      () => props.species,
      () => {
        setShiny(false);
        setFemale(false);
      },
    ),
  );

  /**
   * What the reader's dex says about any species, for the evolution
   * line. Read without waiting, so an unarrived dex draws silhouettes
   * that fill in rather than holding the entry up
   */
  const dexKnows = (species: Species): DexKnows => {
    const view = answered(props.pokedex);
    let owned = false;
    let sparkled = false;
    let seen = false;

    for (const tally of view?.caught ?? []) {
      if (tally.species === species) {
        owned = true;
        sparkled = tally.shiny > 0;
        break;
      }
    }
    for (const tally of view?.seen ?? []) {
      if (tally.species === species) {
        seen = true;
        break;
      }
    }
    return { met: seen || owned, owned, shiny: sparkled };
  };

  return (
    <Show when={showing()} fallback={<Note>{m.dex_no_species()}</Note>}>
      {(entry) => (
        // Three columns that hold still, each card scrolling on its own:
        // what it is on the left, what it is made of in the middle, and
        // what it learns on the right. One column on a phone
        <div
          class="flex flex-col gap-3 md:grid md:min-h-0 md:flex-1
            md:grid-cols-[17rem_minmax(0,1fr)_minmax(0,1fr)]"
        >
          <div class="flex min-h-0 flex-col gap-3">
            <Portrait
              species={entry().species}
              data={entry().data}
              met={known().met}
              owned={known().owned}
              ownedShiny={known().shiny}
              shiny={shiny()}
              female={female()}
              hasFemale={props.female() === true}
              onShiny={(sparkling) => {
                setShiny(sparkling);
              }}
              onFemale={(drawn) => {
                setFemale(drawn);
              }}
            />

            <Show when={known().met}>
              <Facts data={entry().data} candy={props.candy} />
              <EvolutionLine
                species={entry().species}
                name={entry().data.name}
                dexKnows={dexKnows}
                onSpecies={props.onSpecies}
              />
            </Show>
          </div>

          <Show
            when={known().met}
            fallback={
              <div
                class="flex min-h-40 items-center justify-center rounded-card border-2 border-dashed
                  border-line p-6 text-center text-[15px] font-bold text-muted md:col-span-2"
              >
                {m.dex_meet_first()}
              </div>
            }
          >
            <div class="flex min-h-0 flex-col gap-3">
              <BaseStats data={entry().data} />
              <Abilities species={entry().species} data={entry().data} />
              <Habitat species={entry().species} />
            </div>
            <div class="flex min-h-0 flex-col">
              <MoveLists species={entry().species} data={entry().data} />
            </div>
          </Show>
        </div>
      )}
    </Show>
  );
}
