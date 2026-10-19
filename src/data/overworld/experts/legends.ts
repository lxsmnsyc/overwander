import * as v from 'valibot';
import type Awards from '../../ids/awards';
import Legend from '../../ids/legends';
import { AWARD_IDS, LEGEND_IDS, SPECIES_IDS } from '../../ids/names';
import type { Species } from '../../ids/species';
import namesFile from '../../text/en/legends.yaml';
import { idOf, idsOf } from '../../yaml';
import legendsFile from './legends.yaml';

export { Legend };

/**
 * The legends, read out of `legends.yaml` and `text/en/legends.yaml`;
 * the numbers are `ids/legends.ts`
 */
const LEGEND = v.object({
  honor: v.string(),
  sheets: v.array(v.string()),
  prize: v.array(v.string()),
  party: v.array(v.string()),
});

/** Every legend, in the order they are numbered */
export const LEGENDS: Legend[] = [];

export const LEGEND_NAMES: Record<number, string> = {};

/** The sheets each is seen in */
export const LEGEND_CHARSETS: Record<number, string[]> = {};

/** The mark beating one is worth, which is the only thing they pay */
export const LEGEND_HONORS: Record<number, Awards> = {};

/** And the coats that mark unlocks */
export const LEGEND_PRIZE_CHARSETS: Record<number, string[]> = {};

/** A legend's own six, the way a champion's is their own */
export const LEGEND_PARTIES: Record<number, Species[]> = {};

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), LEGEND), legendsFile))) {
  const where = `legends.yaml: ${name}`;
  const legend = idOf<Legend>(LEGEND_IDS, name, where);

  LEGENDS.push(legend);
  LEGEND_HONORS[legend] = idOf<Awards>(AWARD_IDS, written.honor, where);
  LEGEND_CHARSETS[legend] = written.sheets;
  LEGEND_PRIZE_CHARSETS[legend] = written.prize;
  LEGEND_PARTIES[legend] = idsOf<Species>(SPECIES_IDS, written.party, where);
}
LEGENDS.sort((one, two) => one - two);

for (const [name, title] of Object.entries(v.parse(v.record(v.string(), v.string()), namesFile))) {
  LEGEND_NAMES[idOf<Legend>(LEGEND_IDS, name, `text/en/legends.yaml: ${name}`)] = title;
}

// Every legend the enum has is written down, so none turns up nameless or bare
for (const [name, legend] of Object.entries(LEGEND_IDS)) {
  if (!Object.hasOwn(LEGEND_HONORS, legend) || !Object.hasOwn(LEGEND_NAMES, legend)) {
    throw new Error(`${name} needs a record in legends.yaml and a name in text/en`);
  }
}
