import * as v from 'valibot';
import type Awards from '../../ids/awards';
import {
  HOENN_HONORS,
  JOHTO_HONORS,
  KALOS_HONORS,
  KANTO_HONORS,
  SINNOH_HONORS,
  UNOVA_HONORS,
} from '../../ids/awards';
import Champion from '../../ids/champions';
import { AWARD_IDS, CHAMPION_IDS, SPECIES_IDS } from '../../ids/names';
import type { Species } from '../../ids/species';
import namesFile from '../../text/en/champions.yaml';
import { idOf, idsOf } from '../../yaml';
import championsFile from './champions.yaml';

export { Champion };

/**
 * The champions, read out of `champions.yaml` and
 * `text/en/champions.yaml`; the numbers are `ids/champions.ts`
 */
const CHAMPION = v.object({
  title: v.string(),
  league: v.string(),
  sheets: v.array(v.string()),
  prize: v.optional(v.array(v.string())),
  party: v.array(v.string()),
});

/** Each league's Elite Four, by the name a champion's `league` is written in */
const LEAGUE_HONORS: Record<string, Awards[]> = {
  Kanto: KANTO_HONORS,
  Johto: JOHTO_HONORS,
  Hoenn: HOENN_HONORS,
  Sinnoh: SINNOH_HONORS,
  Unova: UNOVA_HONORS,
  Kalos: KALOS_HONORS,
};

/** Every champion, in the order they are numbered */
export const CHAMPIONS: Champion[] = [];

export const CHAMPION_NAMES: Record<number, string> = {};

/** The sheets each is seen in */
export const CHAMPION_CHARSETS: Record<number, string[]> = {};

/** The title a champion's seat is worth */
export const CHAMPION_TITLES: Record<number, Awards> = {};

/** The coats a champion's title unlocks besides the ones they are seen in */
export const CHAMPION_PRIZE_CHARSETS: Partial<Record<number, string[]>> = {};

/** The Elite Four a champion asks to see beaten first */
export const CHAMPION_HONORS: Record<number, Awards[]> = {};

/** The champion's own six */
export const CHAMPION_PARTIES: Record<number, Species[]> = {};

for (const [name, written] of Object.entries(
  v.parse(v.record(v.string(), CHAMPION), championsFile),
)) {
  const where = `champions.yaml: ${name}`;
  const champion = idOf<Champion>(CHAMPION_IDS, name, where);

  CHAMPIONS.push(champion);
  CHAMPION_TITLES[champion] = idOf<Awards>(AWARD_IDS, written.title, where);
  CHAMPION_HONORS[champion] = idOf(LEAGUE_HONORS, written.league, where);
  CHAMPION_CHARSETS[champion] = written.sheets;
  CHAMPION_PARTIES[champion] = idsOf<Species>(SPECIES_IDS, written.party, where);
  if (written.prize != null) {
    CHAMPION_PRIZE_CHARSETS[champion] = written.prize;
  }
}
CHAMPIONS.sort((one, two) => one - two);

for (const [name, title] of Object.entries(v.parse(v.record(v.string(), v.string()), namesFile))) {
  CHAMPION_NAMES[idOf<Champion>(CHAMPION_IDS, name, `text/en/champions.yaml: ${name}`)] = title;
}

// Every champion the enum has is written down, so no seat stands empty or nameless
for (const [name, champion] of Object.entries(CHAMPION_IDS)) {
  if (!Object.hasOwn(CHAMPION_TITLES, champion) || !Object.hasOwn(CHAMPION_NAMES, champion)) {
    throw new Error(`${name} needs a record in champions.yaml and a name in text/en`);
  }
}
