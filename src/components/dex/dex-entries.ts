import type { Species } from '../../data/ids/species';
import { getBaseFormSpecies } from '../../data/ids/forms';
import { getBaseForms, getSpeciesData, getSpeciesForms } from '../../data/species';
import type { DexTally } from '../../model/pokedex-record';
import { listShinySpecies } from '../../model/pokedex-record';
import type { DexEntry } from './PokedexGrid';

/** The two lenses the dex is read through */
export type DexMode = 'regular' | 'shiny';

/** What the entry builders read: the two lists a dex view carries */
export interface DexTallies {
  seen: DexTally[];
  caught: DexTally[];
}

/**
 * Which species are met and which are owned, as the mode reads them.
 *
 * Regular reads every coat. Shiny reads only sparkling ones: a
 * sparkling one owned counts as met, as an owned one does in the regular
 * dex, so a shiny caught but never seen still lights its square
 */
export function readDexFlags(
  view: DexTallies | undefined,
  mode: DexMode,
  forms: boolean,
): { seen: Set<Species>; caught: Set<Species> } {
  const seen = new Set<Species>();
  const caught = new Set<Species>();

  if (view == null) {
    return { seen, caught };
  }
  if (mode === 'shiny') {
    for (const species of listShinySpecies(view.caught, forms)) {
      caught.add(species);
      seen.add(species);
    }
    for (const species of listShinySpecies(view.seen, forms)) {
      seen.add(species);
    }
    return { seen, caught };
  }
  for (const tally of view.seen) {
    seen.add(forms ? tally.species : getBaseFormSpecies(tally.species));
  }
  for (const tally of view.caught) {
    caught.add(forms ? tally.species : getBaseFormSpecies(tally.species));
  }
  return { seen, caught };
}

/**
 * One row per base form in dex order. A row with several forms lights
 * from any of them, which is the rule the dex counts by
 */
export function buildDexEntries(view: DexTallies | undefined, mode: DexMode): DexEntry[] {
  const { seen, caught } = readDexFlags(view, mode, false);
  const rows: DexEntry[] = [];

  for (const species of getBaseForms()) {
    const data = getSpeciesData(species);

    rows.push({
      species,
      dexNumber: data.dexNumber,
      name: data.name,
      seen: seen.has(species),
      caught: caught.has(species),
      shiny: mode === 'shiny',
      forms: getSpeciesForms(species).length > 1,
    });
  }
  return rows.sort((one, other) => one.dexNumber - other.dexNumber);
}
