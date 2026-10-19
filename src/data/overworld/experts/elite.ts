import * as v from 'valibot';
import type { Types } from '../../constants/types';
import type Awards from '../../ids/awards';
import {
  HOENN_BADGES,
  HOENN_HONORS,
  JOHTO_BADGES,
  JOHTO_HONORS,
  KALOS_BADGES,
  KALOS_HONORS,
  KANTO_BADGES,
  KANTO_HONORS,
  SINNOH_BADGES,
  SINNOH_HONORS,
  UNOVA_BADGES,
  UNOVA_HONORS,
} from '../../ids/awards';
import type Biome from '../../ids/biome';
import type EggGroups from '../../ids/egg-groups';
import EliteMember from '../../ids/elite';
import {
  AWARD_IDS,
  BIOME_IDS,
  EGG_GROUP_IDS,
  ELITE_MEMBER_IDS,
  SPECIES_IDS,
  TYPE_IDS,
} from '../../ids/names';
import type { Species } from '../../ids/species';
import namesFile from '../../text/en/elite.yaml';
import { idOf, idsOf } from '../../yaml';
import biomesFile from './biome-elite.yaml';
import eliteFile from './elite.yaml';
import type { ExpertPool } from './pools';

export { EliteMember };

/**
 * The Elite Four, read out of `elite.yaml`, `biome-elite.yaml` and
 * `text/en/elite.yaml`; the numbers are `ids/elite.ts`
 */
const MEMBER = v.object({
  type: v.string(),
  honor: v.string(),
  sheets: v.array(v.string()),
  signature: v.string(),
  pool: v.object({
    types: v.array(v.string()),
    'egg-groups': v.optional(v.array(v.string())),
    also: v.optional(v.array(v.string())),
  }),
});

/** Every seat, in the order they are numbered */
export const ELITE_MEMBERS: EliteMember[] = [];

export const ELITE_MEMBER_NAMES: Record<number, string> = {};

/** The type each is known for */
export const ELITE_MEMBER_TYPES: Record<number, Types> = {};

/** The mark beating each pays */
export const ELITE_MEMBER_HONORS: Record<number, Awards> = {};

/** The sheets each is seen in */
export const ELITE_MEMBER_CHARSETS: Record<number, string[]> = {};

/**
 * What each fields. Each widening is the one their mainline team
 * actually shows: Bruno brings hard ground along with the muscle,
 * Agatha's ghosts keep the company they keep, and Lance's dragons are
 * read off the breeding table rather than the type chart
 */
export const ELITE_MEMBER_POOLS: Record<number, ExpertPool> = {};

/**
 * The one an elite is remembered for, standing last the way a gym
 * leader's does. Bruno's is his Machamp in both leagues, since Bruno
 * is in both
 */
export const ELITE_MEMBER_SIGNATURES: Record<number, Species> = {};

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), MEMBER), eliteFile))) {
  const where = `elite.yaml: ${name}`;
  const member = idOf<EliteMember>(ELITE_MEMBER_IDS, name, where);
  const pool: ExpertPool = { types: idsOf<Types>(TYPE_IDS, written.pool.types, where) };
  const eggGroups = written.pool['egg-groups'];

  if (eggGroups != null) {
    pool.eggGroups = idsOf<EggGroups>(EGG_GROUP_IDS, eggGroups, where);
  }
  if (written.pool.also != null) {
    pool.also = idsOf<Species>(SPECIES_IDS, written.pool.also, where);
  }
  ELITE_MEMBERS.push(member);
  ELITE_MEMBER_TYPES[member] = idOf<Types>(TYPE_IDS, written.type, where);
  ELITE_MEMBER_HONORS[member] = idOf<Awards>(AWARD_IDS, written.honor, where);
  ELITE_MEMBER_CHARSETS[member] = written.sheets;
  ELITE_MEMBER_SIGNATURES[member] = idOf<Species>(SPECIES_IDS, written.signature, where);
  ELITE_MEMBER_POOLS[member] = pool;
}
ELITE_MEMBERS.sort((one, two) => one - two);

for (const [name, title] of Object.entries(v.parse(v.record(v.string(), v.string()), namesFile))) {
  ELITE_MEMBER_NAMES[idOf<EliteMember>(ELITE_MEMBER_IDS, name, `text/en/elite.yaml: ${name}`)] =
    title;
}

// Every seat the enum has is written down, so none stands nameless or bare
for (const [name, member] of Object.entries(ELITE_MEMBER_IDS)) {
  if (!Object.hasOwn(ELITE_MEMBER_TYPES, member) || !Object.hasOwn(ELITE_MEMBER_NAMES, member)) {
    throw new Error(`${name} needs a record in elite.yaml and a name in text/en`);
  }
}

/**
 * The badge case an elite asks to see before they will fight: their
 * own league's. Bruno asks for both, because his one mark is counted
 * by both leagues, and a mark that opens two doors is worth two
 * regions of gyms
 */
export function getEliteBadges(member: EliteMember): Awards[] {
  const honor = ELITE_MEMBER_HONORS[member];

  return [
    ...(KANTO_HONORS.includes(honor) ? KANTO_BADGES : []),
    ...(JOHTO_HONORS.includes(honor) ? JOHTO_BADGES : []),
    ...(HOENN_HONORS.includes(honor) ? HOENN_BADGES : []),
    ...(SINNOH_HONORS.includes(honor) ? SINNOH_BADGES : []),
    ...(UNOVA_HONORS.includes(honor) ? UNOVA_BADGES : []),
    ...(KALOS_HONORS.includes(honor) ? KALOS_BADGES : []),
  ];
}

/**
 * Which of the Elite Four hold each biome's seats, in the order the
 * window's roll picks from. A seat holds several names across the
 * leagues, and the roll says whose it is
 */
export const BIOME_ELITE_MEMBERS: Record<number, EliteMember[]> = {};

for (const [name, members] of Object.entries(
  v.parse(v.record(v.string(), v.array(v.string())), biomesFile),
)) {
  const where = `biome-elite.yaml: ${name}`;

  BIOME_ELITE_MEMBERS[idOf<Biome>(BIOME_IDS, name, where)] = idsOf<EliteMember>(
    ELITE_MEMBER_IDS,
    members,
    where,
  );
}
