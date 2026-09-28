import { getSpawnPool, getSpawnRarity, pickFromEntries } from '../data/biome';
import type Biome from '../data/ids/biome';
import { type TimeOfDay, WILD_BIOMES } from '../data/ids/biome';
import type { Species } from '../data/ids/species';
import { TRADER_OFFERS } from '../data/overworld/npc';
import type ChunkSnapshot from './chunk-snapshot';
import type { Spawn } from './chunk-snapshot';
import deriveEncounter, { EncounterType } from './encounter';
import type { Encounter } from './encounter/shape';

/** How many draws an offer gets before giving up on a slot, so a thin world cannot hang it */
const TRADER_TRIES = 64;

/**
 * What the trader brings this window: pokemon from the young bands of
 * biomes other than the one he stands in, no species twice. The draw
 * is the caller's, so both sides roll the same six
 */
export function rollTraderOffer(
  home: Biome,
  time: TimeOfDay,
  random: () => number,
  int: () => number,
): Spawn[] {
  const away: Biome[] = [];

  for (const biome of WILD_BIOMES) {
    if (biome !== home) {
      away.push(biome);
    }
  }

  const offer: Spawn[] = [];
  const taken = new Set<Species>();

  for (let tries = 0; offer.length < TRADER_OFFERS && tries < TRADER_TRIES; tries++) {
    const pool = getSpawnPool(away[Math.floor(random() * away.length)], time);
    const species = pickFromEntries([...pool.base, ...pool.uncommon], random);

    if (species != null && !taken.has(species)) {
      taken.add(species);
      offer.push([species, int(), int()]);
    }
  }
  return offer;
}

/** The pokemon one offer hands over, the same on both sides of the counter */
export function deriveTraderPokemon(snapshot: ChunkSnapshot, spawn: Spawn, uid: string): Encounter {
  return deriveEncounter(snapshot, spawn, uid, { type: EncounterType.Wild, shadow: false });
}

/** Whether a catch pays for this offer: the same spawn band, whatever the species */
export function paysForOffer(caught: Species, offered: Species): boolean {
  return getSpawnRarity(caught) === getSpawnRarity(offered);
}
