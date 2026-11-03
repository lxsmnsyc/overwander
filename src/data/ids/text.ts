import * as v from 'valibot';
import type EggGroups from './egg-groups';
import type Families from './families';
import { EGG_GROUP_IDS, FAMILY_IDS, NATURE_IDS } from './names';
import type Natures from './natures';
import { type Locale, baseLocale, isLocale } from '../../i18n/locale';
import { localeStringTable } from '../yaml';

/**
 * What the enums in this folder that are only a name are called. They
 * sit apart from the enums because `names.ts` reads the enums and
 * these read `names.ts`
 */

const SPECIES_FILE = v.record(
  v.string(),
  v.record(v.string(), v.looseObject({ name: v.optional(v.string()) })),
);

/**
 * What a locale calls each family, out of its species names: a family
 * is called what the pokemon it is named for is called. A locale's own
 * `families.yaml` may still write one. Read off the files, not the
 * registry, which reads this
 */
function readFamilyNames(): Map<Locale, Record<string, string>> {
  const names = new Map<Locale, Record<string, string>>();

  for (const [path, file] of Object.entries(
    import.meta.glob<unknown>('../text/*/species/**/*.yaml', { eager: true, import: 'default' }),
  )) {
    const locale = /\/text\/([^/]+)\//.exec(path)?.[1] ?? '';

    // English is the family names' own file
    if (!isLocale(locale) || locale === baseLocale) {
      continue;
    }

    let lines = names.get(locale);

    if (lines == null) {
      lines = {};
      names.set(locale, lines);
    }
    for (const [family, members] of Object.entries(v.parse(SPECIES_FILE, file))) {
      const said = members[family]?.name;

      if (said != null) {
        lines[family] = said;
      }
    }
  }
  return names;
}

/**
 * What each family is called: the pokemon the line is known as, which
 * is the enum's own key. A test holds every entry against the species
 * registered under that family
 */
export const FAMILY_NAMES = localeStringTable<Families>(
  FAMILY_IDS,
  import.meta.glob('../text/*/families.yaml', { eager: true, import: 'default' }),
  'text/<locale>/families.yaml',
  undefined,
  readFamilyNames(),
);

/** What each nature is called, so nothing prints a nature's number */
export const NATURE_NAMES = localeStringTable<Natures>(
  NATURE_IDS,
  import.meta.glob('../text/*/natures.yaml', { eager: true, import: 'default' }),
  'text/<locale>/natures.yaml',
);

/**
 * What each egg group is called. The water groups are numbered in the
 * games, and a species with nothing to breed with is "undiscovered"
 */
export const EGG_GROUP_NAMES = localeStringTable<EggGroups>(
  EGG_GROUP_IDS,
  import.meta.glob('../text/*/egg-groups.yaml', { eager: true, import: 'default' }),
  'text/<locale>/egg-groups.yaml',
);
