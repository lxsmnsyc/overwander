import type Awards from '../../../data/ids/awards';
import { EXECUTIVE_CHARSETS, EXECUTIVE_HONORS } from '../../../data/overworld/npc';
import {
  SYNDICATES,
  SYNDICATE_BOSS_CHARSETS,
  SYNDICATE_BOSS_HONORS,
  SYNDICATE_EXECUTIVES,
  SYNDICATE_GRUNT_CHARSETS,
  SYNDICATE_GRUNT_HONORS,
} from '../../../data/overworld/syndicate';
import {
  CHAMPION_TITLES,
  ELITE_MEMBERS,
  ELITE_MEMBER_CHARSETS,
  ELITE_MEMBER_HONORS,
  LEGENDS,
  LEGEND_CHARSETS,
  LEGEND_HONORS,
} from '../../../data/overworld/experts';

/**
 * Each mark won off a person is that person: their first charset, the
 * portrait the challenge dialog uses: the Elite Four, the legends and
 * Team Rocket's boss all pay one
 */
export const PERSON_AWARD_SHEETS = ((): Partial<Record<Awards, string>> => {
  const sheets: Partial<Record<Awards, string>> = {};

  for (const member of ELITE_MEMBERS) {
    sheets[ELITE_MEMBER_HONORS[member]] = ELITE_MEMBER_CHARSETS[member][0];
  }
  for (const legend of LEGENDS) {
    sheets[LEGEND_HONORS[legend]] = LEGEND_CHARSETS[legend][0];
  }
  for (const syndicate of SYNDICATES) {
    sheets[SYNDICATE_BOSS_HONORS[syndicate]] = SYNDICATE_BOSS_CHARSETS[syndicate][0];
    sheets[SYNDICATE_GRUNT_HONORS[syndicate]] = SYNDICATE_GRUNT_CHARSETS[syndicate][0];
    for (const executive of SYNDICATE_EXECUTIVES[syndicate]) {
      sheets[EXECUTIVE_HONORS[executive]] = EXECUTIVE_CHARSETS[executive][0];
    }
  }
  return sheets;
})();

/** The titles that read as a star rather than as a letter */
export const CHAMPION_TITLES_SET = new Set<Awards>(Object.values(CHAMPION_TITLES));
