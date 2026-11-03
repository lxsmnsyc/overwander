import * as v from 'valibot';
import type { Types } from '../../constants/types';
import { REGION_IDS, TRAINER_IDS, TYPE_IDS } from '../../ids/names';
import type Regions from '../../ids/regions';
import TrainerClass from '../../ids/trainers';
import { addLocaleText, idOf, idsOf, readLocaleText } from '../../yaml';
import hoennFile from './classes/hoenn.yaml';
import johtoFile from './classes/johto.yaml';
import kalosFile from './classes/kalos.yaml';
import kantoFile from './classes/kanto.yaml';
import sinnohFile from './classes/sinnoh.yaml';
import unovaFile from './classes/unova.yaml';

export { TrainerClass };

/**
 * The trainer classes, read out of their region's files: what each
 * fields, the sheets it stands in, the trade it is one region's version
 * of, and what it is called and says. The numbers are `ids/trainers.ts`.
 *
 * A class belongs to a region, and a trade several regions have is
 * written once for each: a Swimmer met on Kanto's water, on Johto's and
 * on Hoenn's is the same trade in three places, drawn differently and
 * fielding what its own region grows.
 *
 * A region's own classes answer the types the ones before it had
 * nobody for: Johto's sages field the Bellsprout of Sprout Tower and
 * its skiers the ice of the north, and Hoenn's answer under local
 * names, so its guitarist is the rocker's trade and its aroma lady
 * the sage's
 */
const CLASS = v.strictObject({
  types: v.array(v.string()),
  sheets: v.array(v.string()),
  trade: v.optional(v.string()),
  ace: v.optional(v.literal(true)),
});

/** Each region's files, the class a file is filed under being its region */
const REGION_FILES: [region: string, classes: unknown, text: Record<string, unknown>][] = [
  [
    'kanto',
    kantoFile,
    import.meta.glob('../../text/*/trainers/kanto.yaml', { eager: true, import: 'default' }),
  ],
  [
    'johto',
    johtoFile,
    import.meta.glob('../../text/*/trainers/johto.yaml', { eager: true, import: 'default' }),
  ],
  [
    'hoenn',
    hoennFile,
    import.meta.glob('../../text/*/trainers/hoenn.yaml', { eager: true, import: 'default' }),
  ],
  [
    'sinnoh',
    sinnohFile,
    import.meta.glob('../../text/*/trainers/sinnoh.yaml', { eager: true, import: 'default' }),
  ],
  [
    'unova',
    unovaFile,
    import.meta.glob('../../text/*/trainers/unova.yaml', { eager: true, import: 'default' }),
  ],
  [
    'kalos',
    kalosFile,
    import.meta.glob('../../text/*/trainers/kalos.yaml', { eager: true, import: 'default' }),
  ],
];

/** Every class, in the order they are numbered */
export const TRAINER_CLASSES: TrainerClass[] = [];

/**
 * Which region's road each stands on, and whose species they field.
 * The class says this rather than the country they are met in: the
 * world is one map, and a Johto Swimmer brings Johto's water
 * wherever the water is
 */
export const TRAINER_REGIONS: Record<number, Regions> = {};

/**
 * What each class fields, as the types that count as theirs. Most
 * bring one, some bring the pair the mainline gives them, and the Aces
 * bring an empty list, which is every type there is: that is what
 * makes them the hard fight of the road
 */
export const TRAINER_TYPES: Record<number, Types[]> = {};

/**
 * The charsets a class may be standing in, rolled per stop the way a
 * wanderer's style is
 */
export const TRAINER_CHARSETS: Record<number, string[]> = {};

/**
 * The trade a class is one region's version of, which is itself for a
 * class that stands for its trade.
 *
 * What is counted about a trade is counted once: the wins add up to
 * one line and one title. The coats do not, since a coat is one
 * region's own, and beating Kanto's swimmers never dressed anybody as
 * a Johto one
 */
export const TRAINER_TRADE: Record<number, TrainerClass> = {};

/**
 * What the mainline calls each of them. Two regions' worth of the
 * same trade share a name here; `TRAINER_NAMES` is what tells them
 * apart on a screen
 */
export const TRAINER_BASE_NAMES: Record<number, string> = {};

/**
 * The same names in English alone, for code that tells classes apart by
 * name whatever language is shown
 */
export const ENGLISH_TRAINER_NAMES: Record<number, string> = {};

/** What each says as the duel is put to the player */
export const TRAINER_QUOTES: Record<number, string> = {};

/**
 * The Aces, one a region: no type, five fully grown, and the levels
 * and the purse to match
 */
export const ACE_TRAINERS = new Set<TrainerClass>();

for (const [file, classes, text] of REGION_FILES) {
  const region = idOf<Regions>(
    REGION_IDS,
    `${file.slice(0, 1).toUpperCase()}${file.slice(1)}`,
    file,
  );

  for (const [name, written] of Object.entries(v.parse(v.record(v.string(), CLASS), classes))) {
    const where = `trainers/classes/${file}.yaml: ${name}`;
    const trainer = idOf<TrainerClass>(TRAINER_IDS, name, where);

    TRAINER_CLASSES.push(trainer);
    TRAINER_REGIONS[trainer] = region;
    TRAINER_TYPES[trainer] = idsOf<Types>(TYPE_IDS, written.types, where);
    TRAINER_CHARSETS[trainer] = written.sheets;
    TRAINER_TRADE[trainer] =
      written.trade == null ? trainer : idOf<TrainerClass>(TRAINER_IDS, written.trade, where);
    if (written.ace === true) {
      ACE_TRAINERS.add(trainer);
    }
  }

  // Each region's words, in the player's locale, by the class they are filed under
  const textFile = `text/<locale>/trainers/${file}.yaml`;

  const names = readLocaleText(text, textFile, 'name');

  addLocaleText(TRAINER_BASE_NAMES, TRAINER_IDS, names, textFile);
  for (const [name, said] of names.english) {
    ENGLISH_TRAINER_NAMES[idOf<TrainerClass>(TRAINER_IDS, name, textFile)] = said;
  }
  addLocaleText(TRAINER_QUOTES, TRAINER_IDS, readLocaleText(text, textFile, 'quote'), textFile);
}

// Filed by region, numbered across them: the number is the order
TRAINER_CLASSES.sort((one, two) => one - two);

// Every class the enum has is written down, so none stands nameless,
// bare or dressed in nothing
for (const [name, trainer] of Object.entries(TRAINER_IDS)) {
  if (!Object.hasOwn(TRAINER_REGIONS, trainer) || !Object.hasOwn(TRAINER_BASE_NAMES, trainer)) {
    throw new Error(
      `${name} needs a record under trainers/classes and a name under text/en/trainers`,
    );
  }
  if (TRAINER_CHARSETS[trainer].length === 0) {
    throw new Error(`${name} needs at least one sheet to stand in`);
  }
}
