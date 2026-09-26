import type { Genders, Species } from '../data/ids/species';
import type { Buddy } from './core';
import type { Encounter } from './encounter';
import { MAX_CATCH_BONUS, type SafariContext, encounterKey, masteryOf } from './safari';
import createOverworld from './setup';

/**
 * The facts about a player a throw depends on, read by whoever is
 * rolling it. The browser reads them to show the odds and the server
 * reads them to decide the throw, and both build the context here so
 * the two cannot disagree about the math
 */
export interface SafariFacts {
  /** Whether they already own this species, for the Repeat Ball */
  speciesCaught: boolean;
  /** How many species their dex shows as caught */
  dex: number;
  /** The pokemon walking beside them, or null */
  buddy: {
    effects: Buddy | null;
    species: Species;
    gender: Genders;
    level: number;
  } | null;
}

export function safariContextOf(
  player: string,
  encounter: Encounter,
  facts: SafariFacts,
): SafariContext {
  const overworld = createOverworld(player, facts.buddy?.effects ?? null);
  const key = encounterKey(encounter);
  const treats = overworld.checkTreats(key, MAX_CATCH_BONUS);
  const critical = overworld.checkCriticalCatch(key, encounter);

  return {
    speciesCaught: facts.speciesCaught,
    cap: treats.cap,
    keeps: treats.keeps,
    mastery: masteryOf(facts.dex),
    keen: critical.boost,
    aims: critical.aims,
    charm: overworld.checkCatchChance(key, encounter),
    trap: overworld.checkFleeChance(key, encounter),
    buddy:
      facts.buddy == null
        ? undefined
        : { species: facts.buddy.species, gender: facts.buddy.gender, level: facts.buddy.level },
  };
}
