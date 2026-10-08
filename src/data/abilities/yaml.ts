import * as v from 'valibot';
import type Abilities from '../ids/abilities';
import type Families from '../ids/families';
import { ABILITY_IDS, FAMILY_IDS, SPECIES_IDS } from '../ids/names';
import type { Species } from '../ids/species';
import { idOf, idsOf } from '../yaml';
import type { AbilityData } from './__create';

/**
 * The abilities, read out of their YAML.
 *
 * An ability is a name and a line saying what it does, so all of it is
 * text: `text/<locale>/abilities/` holds one file per generation and
 * one per region for the signatures. Which family is granted which
 * signature is `signatures/<region>.yaml`. What any of them does in a
 * fight is code, in `src/battle/abilities/`
 */

const NAME = v.string();

const TEXT = v.record(NAME, v.object({ name: v.string(), description: v.string() }));

const SIGNATURES = v.object({
  families: v.record(NAME, NAME),
  forms: v.optional(v.record(NAME, v.array(NAME)), {}),
});

/** Every ability the files name, in id order */
export function readAbilities(files: Record<string, unknown>): [Abilities, AbilityData][] {
  const read = new Map<Abilities, AbilityData>();

  for (const [path, file] of Object.entries(files)) {
    for (const [name, data] of Object.entries(v.parse(TEXT, file))) {
      const ability = idOf<Abilities>(ABILITY_IDS, name, path);

      if (read.has(ability)) {
        throw new Error(`${path}: ${name} is written twice`);
      }
      read.set(ability, data);
    }
  }
  return [...read].sort(([one], [two]) => one - two);
}

/** Which signature each family, and each regional line, is granted */
export interface SignatureGrants {
  families: [Families, Abilities][];
  forms: [Species[], Abilities][];
}

export function readSignatures(files: Record<string, unknown>): SignatureGrants {
  const grants: SignatureGrants = { families: [], forms: [] };

  for (const [path, file] of Object.entries(files)) {
    const written = v.parse(SIGNATURES, file);

    for (const [family, ability] of Object.entries(written.families)) {
      const where = `${path}: ${family}`;

      grants.families.push([
        idOf<Families>(FAMILY_IDS, family, where),
        idOf<Abilities>(ABILITY_IDS, ability, where),
      ]);
    }
    for (const [ability, forms] of Object.entries(written.forms)) {
      const where = `${path}: ${ability}`;

      grants.forms.push([
        idsOf<Species>(SPECIES_IDS, forms, where),
        idOf<Abilities>(ABILITY_IDS, ability, where),
      ]);
    }
  }
  return grants;
}
