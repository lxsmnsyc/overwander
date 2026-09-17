import { useSearchParams } from '@solidjs/router';
import { type JSX, createMemo, createSignal } from 'solid-js';
import type { PokedexView, SpeciesDexEntry } from '../../auth/pokedex';
import type { DexTally } from '../../auth/pokedex-record';
import { Species } from '../../data/ids/species';
import { getRegisteredSpecies, getSpeciesData } from '../../data/species';
import DexEntryDialog, { type DexReads } from '../dex/dex-entry-dialog';
import { Button, Combobox, Meta, Row, Switch } from '../styled';

/**
 * One dex entry, with the reader's dex made up. Nothing is read from an
 * account: the switches decide what has been met, owned and seen
 * sparkling, for this species and every other one in its line.
 */

/** The stand-in ids that are drawn but are not species */
const NOT_SPECIES = new Set<Species>([Species.Missingno, Species.Egg, Species.Substitute]);

/** How many of each the made-up dex says were met and caught */
const SEEN = 12;
const CAUGHT = 3;

interface Standing {
  met: boolean;
  owned: boolean;
  shiny: boolean;
  candy: number;
}

function tallyOf(species: Species, count: number, shiny: boolean): DexTally {
  return {
    species,
    regular: count,
    shiny: shiny ? 1 : 0,
    total: count + (shiny ? 1 : 0),
  };
}

/** Made-up reads that answer the same for every species */
function readsFor(standing: Standing): DexReads {
  const seen = standing.met ? SEEN : 0;
  const caught = standing.owned ? CAUGHT : 0;

  return {
    entry: (_player, species): SpeciesDexEntry => ({
      species,
      seen: tallyOf(species, seen, standing.shiny && standing.met),
      caught: tallyOf(species, caught, standing.shiny && standing.owned),
      met: standing.met,
      owned: standing.owned,
      shiny: standing.shiny && standing.owned,
    }),
    candy: () => standing.candy,
    pokedex: (): PokedexView => {
      const seenTallies: DexTally[] = [];
      const caughtTallies: DexTally[] = [];

      for (const species of getRegisteredSpecies()) {
        if (standing.met) {
          seenTallies.push(tallyOf(species, SEEN, standing.shiny));
        }
        if (standing.owned) {
          caughtTallies.push(tallyOf(species, CAUGHT, standing.shiny));
        }
      }
      return {
        seenSpecies: seenTallies.length,
        caughtSpecies: caughtTallies.length,
        seen: seenTallies,
        caught: caughtTallies,
      };
    },
  };
}

export default function PokedexDemo(): JSX.Element {
  const [params, setParams] = useSearchParams<{ species?: string }>();
  const [open, setOpen] = createSignal(true);
  const [met, setMet] = createSignal(true);
  const [owned, setOwned] = createSignal(true);
  const [shiny, setShiny] = createSignal(false);

  const options = createMemo(() => {
    const listed: { value: Species; label: string }[] = [];

    for (const species of getRegisteredSpecies()) {
      if (!NOT_SPECIES.has(species)) {
        listed.push({ value: species, label: getSpeciesData(species).name });
      }
    }
    return listed.sort((left, right) => left.label.localeCompare(right.label));
  });

  const chosen = (): Species => {
    const read = Number(params.species);

    return Number.isInteger(read) && read > 0 && !NOT_SPECIES.has(read) ? read : Species.Eevee;
  };

  // The switches go into the reader's name, so the entry reads again
  // whenever one of them is flipped
  const player = (): string => `demo:${met()}:${owned()}:${shiny()}`;

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
      <div class="flex flex-wrap items-end gap-2">
        <h1 class="grow">Pokedex demo</h1>
        <Combobox
          label="Species"
          class="w-64"
          value={chosen()}
          options={options()}
          placeholder="Search species"
          onChange={(species) => {
            setParams({ species: String(species) });
            setOpen(true);
          }}
        />
      </div>

      <Switch
        label="Met"
        description="Whether the species has been seen. Unmet, the entry keeps its name and details to itself."
        checked={met()}
        onChange={(on) => {
          setMet(on);
          if (!on) {
            setOwned(false);
          }
        }}
      />
      <Switch
        label="Caught"
        description="Whether one is owned, which is what reveals its regular coat."
        checked={owned()}
        onChange={(on) => {
          setOwned(on);
          if (on) {
            setMet(true);
          }
        }}
      />
      <Switch
        label="Shiny caught"
        description="Whether a sparkling one is owned, which reveals the shiny coat."
        checked={shiny()}
        onChange={(on) => {
          setShiny(on);
        }}
      />

      <Row>
        <Button
          tone="primary"
          onClick={() => {
            setOpen(true);
          }}
        >
          Open the entry
        </Button>
        <Meta>
          The switches apply to every species, so the evolution line follows them too. The species
          is in the address, so a link opens the same entry.
        </Meta>
      </Row>

      <DexEntryDialog
        player={player()}
        species={open() ? chosen() : null}
        reads={readsFor({ met: met(), owned: owned(), shiny: shiny(), candy: 124 })}
        onClose={() => {
          setOpen(false);
        }}
        onSpecies={(species) => {
          setParams({ species: String(species) });
        }}
      />
    </main>
  );
}
