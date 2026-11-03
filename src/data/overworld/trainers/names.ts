import { REGION_NAMES } from '../../species/regions';
import { localeLines } from '../../yaml';
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
        const region = REGION_NAMES[TRAINER_REGIONS[trainer]];

        return marked ? `${name} (${region.slice(0, 1).toUpperCase()}${region.slice(1)})` : name;
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
