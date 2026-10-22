import * as v from 'valibot';
import type Awards from './ids/awards';
import { AWARD_IDS } from './ids/names';
import namesFile from './text/en/awards.yaml';
import { idOf, stringTable } from './yaml';
import awardsFile from './awards.yaml';

/**
 * What each award is called, looks like and is drawn as, read out of
 * `awards.yaml` and `text/en/awards.yaml`; the numbers are
 * `ids/awards.ts`
 */
export const AWARD_NAMES = stringTable<Awards>(AWARD_IDS, namesFile, 'text/en/awards.yaml');

/** Each award's color, for the earned state of its disc */
export const AWARD_COLORS: Record<number, string> = {};

/**
 * Where each award's picture sits, where one ships: the extras sheet
 * and the name on it
 */
export const AWARD_SPRITES: Partial<Record<Awards, [sheet: string, name: string]>> = {};

const AWARD = v.object({
  color: v.string(),
  sprite: v.optional(v.tuple([v.string(), v.string()])),
});

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), AWARD), awardsFile))) {
  const award = idOf<Awards>(AWARD_IDS, name, `awards.yaml: ${name}`);

  AWARD_COLORS[award] = written.color;
  if (written.sprite != null) {
    AWARD_SPRITES[award] = written.sprite;
  }
}
for (const [name, award] of Object.entries(AWARD_IDS)) {
  if (!Object.hasOwn(AWARD_COLORS, award)) {
    throw new Error(`awards.yaml: ${name} is missing`);
  }
}
