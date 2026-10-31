import * as v from 'valibot';
import type Abilities from '../ids/abilities';
import type Families from '../ids/families';
import { ABILITY_IDS, FAMILY_IDS, SPECIES_IDS } from '../ids/names';
import type { Species } from '../ids/species';
import { idOf, idsOf, localize, readOverlays, splitLocales } from '../yaml';
import type { AbilityData } from './__create';

/**
 * The abilities, read out of their YAML.
 *
 * An ability is a name and a line saying what it does, so all of it is
 * text: `text/<locale>/abilities/` holds one file per generation, one
 * for the special abilities (Boss, Shadow, Totem and the rest), and
 * one per region for the signatures. Which family is granted which
 * signature is `signatures/<region>.yaml`. What any of them does in a
 * fight is code, in `src/battle/abilities/`
 */

const NAME = v.string();

const TEXT = v.record(NAME, v.strictObject({ name: v.string(), description: v.string() }));

const SIGNATURES = v.strictObject({
  families: v.record(NAME, NAME),
  forms: v.optional(v.record(NAME, v.array(NAME)), {}),
});

function readEntries(files: Record<string, unknown>): Map<string, unknown> {
  const entries = new Map<string, unknown>();

  for (const file of Object.values(files)) {
    for (const [name, entry] of Object.entries(v.parse(v.record(NAME, v.unknown()), file))) {
      entries.set(name, entry);
    }
  }
  return entries;
}

/**
 * Every ability the files name, in id order. The files are every
 * locale's: English is the record, and any other locale is laid over it
 * (see `splitLocales`)
 */
export function readAbilities(files: Record<string, unknown>): [Abilities, AbilityData][] {
  // English is the record, and any other locale is laid over it
  const byLocale = splitLocales(files);
  const translated = readOverlays(byLocale.overlays, readEntries);

  // Each ability once, its text read in the player's locale
  const read = new Map<Abilities, AbilityData>();

  for (const [path, file] of Object.entries(byLocale.english)) {
    for (const [name, data] of Object.entries(v.parse(TEXT, file))) {
      const ability = idOf<Abilities>(ABILITY_IDS, name, path);

      if (read.has(ability)) {
        throw new Error(`${path}: ${name} is written twice`);
      }
      localize(data, name, translated, ['name', 'description']);
      read.set(ability, data);
    }
  }
  // In id order, which is the order the registry lists them in
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
