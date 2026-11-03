import { REGION_TITLES } from '../../species/regions';
import { localeLines, localePhrases } from '../../yaml';
import {
  ENGLISH_TRAINER_NAMES,
  TRAINER_BASE_NAMES,
  TRAINER_CLASSES,
  TRAINER_REGIONS,
  type TrainerClass,
} from './classes';

/**
 * The sheets a class stands in that the mainline names differently,
 * which is the other half of a pair: a Black Belt met in the Crush
 * Girl's sheet is a Crush Girl
 */
export const TRAINER_SHEET_NAMES: Record<string, string> = localeLines(
  import.meta.glob('../../text/*/trainer-sheets.yaml', { eager: true, import: 'default' }),
  'text/<locale>/trainer-sheets.yaml',
);

/** How a class is told apart from the same trade in another region */
const TRAINER_PHRASES = localePhrases(
  import.meta.glob('../../text/*/trainer-names.yaml', { eager: true, import: 'default' }),
  'text/<locale>/trainer-names.yaml',
  ['region'],
);

/**
 * What a screen calls each class: the mainline name, with the region
 * after it only where more than one region puts that name on the
 * road. A name nobody shares is the mainline's own
 */
export const TRAINER_NAMES: Record<number, string> = buildTrainerNames();

function buildTrainerNames(): Record<number, string> {
  const seen = new Set<string>();
  const shared = new Set<string>();

  // Which classes share a name is settled on the English names, so the
  // same classes carry their region in every locale
  for (const trainer of TRAINER_CLASSES) {
    const name = ENGLISH_TRAINER_NAMES[trainer];

    if (seen.has(name)) {
      shared.add(name);
    }
    seen.add(name);
  }

  const named: Record<number, string> = {};

  for (const trainer of TRAINER_CLASSES) {
    const marked = shared.has(ENGLISH_TRAINER_NAMES[trainer]);

    // Read in the active locale each time, since the server renders several at once
    Object.defineProperty(named, trainer, {
      configurable: true,
      enumerable: true,
      get: () => {
        const name = TRAINER_BASE_NAMES[trainer];
        return marked
          ? TRAINER_PHRASES('region', { name, region: REGION_TITLES[TRAINER_REGIONS[trainer]] })
          : name;
      },
    });
  }
  return named;
}

/**
 * What a screen calls a trainer standing in this sheet: the class' own
 * name, or the name its sheet goes by, with the same region after it
 */
export function trainerNameIn(trainer: TrainerClass, sheet: string | undefined): string {
  const own = sheet == null ? undefined : TRAINER_SHEET_NAMES[sheet];

  return own == null
    ? TRAINER_NAMES[trainer]
    : TRAINER_NAMES[trainer].replace(TRAINER_BASE_NAMES[trainer], own);
}
