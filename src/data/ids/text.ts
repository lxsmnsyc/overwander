import type EggGroups from './egg-groups';
import type Families from './families';
import { EGG_GROUP_IDS, FAMILY_IDS, NATURE_IDS } from './names';
import type Natures from './natures';
import eggGroupsFile from '../text/en/egg-groups.yaml';
import familiesFile from '../text/en/families.yaml';
import { localeStringTable, stringTable } from '../yaml';

/**
 * What the enums in this folder that are only a name are called. They
 * sit apart from the enums because `names.ts` reads the enums and
 * these read `names.ts`
 */

/**
 * What each family is called: the pokemon the line is known as, which
 * is the enum's own key. A test holds every entry against the species
 * registered under that family
 */
export const FAMILY_NAMES = stringTable<Families>(
  FAMILY_IDS,
  familiesFile,
  'text/en/families.yaml',
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
export const EGG_GROUP_NAMES = stringTable<EggGroups>(
  EGG_GROUP_IDS,
  eggGroupsFile,
  'text/en/egg-groups.yaml',
);
