import * as v from 'valibot';
import type { Types } from '../../constants/types';
import type Awards from '../../ids/awards';
import type Biome from '../../ids/biome';
import GymLeader from '../../ids/gym-leaders';
import { type Items, getMachineItem } from '../../ids/items';
import type { Moves } from '../../ids/moves';
import { AWARD_IDS, BIOME_IDS, GYM_LEADER_IDS, SPECIES_IDS, TYPE_IDS } from '../../ids/names';
import type { Species } from '../../ids/species';
import { getTeachableMoves } from '../../items/machines';
import { getMoveData } from '../../moves';
import namesFile from '../../text/en/gym-leaders.yaml';
import { idOf, idsOf } from '../../yaml';
import biomesFile from './biome-gym-leaders.yaml';
import leadersFile from './gym-leaders.yaml';

export { GymLeader };

/**
 * The type experts who stand at the fighting landmarks above a plain
 * trainer: gym leaders, the Elite Four and the Champion. Who stands
 * at a given cell and what they field both turn over with the window,
 * like any other stop.
 *
 * The leaders are data, in `gym-leaders.yaml`, `biome-gym-leaders.yaml`
 * and `text/en/gym-leaders.yaml`; the numbers are `ids/gym-leaders.ts`.
 *
 * Two regions seat more people than they have gyms. Mossdeep is kept
 * by two, so Tate and Liza are a leader each and share the one badge.
 * Unova seats thirteen over ten badges: Striaton is kept by three who
 * each fight a different type, and Nacrene's fight passes to Cheren
 * in Aspertia a league later, so the Basic Badge has two keepers as
 * well. Iris is left out, since Opelucid is Drayden's here
 */
const LEADER = v.object({
  type: v.string(),
  badge: v.string(),
  sheets: v.array(v.string()),
  prize: v.optional(v.array(v.string())),
  later: v.optional(v.array(v.string())),
  signature: v.string(),
});

/** Every leader, in the order they are numbered */
export const GYM_LEADERS: GymLeader[] = [];

export const GYM_LEADER_NAMES: Record<number, string> = {};

/** What each leader fields */
export const GYM_LEADER_TYPES: Record<number, Types> = {};

/** The badge beating each pays */
export const GYM_LEADER_BADGES: Record<number, Awards> = {};

/** The sheets each is seen in */
export const GYM_LEADER_CHARSETS: Record<number, string[]> = {};

/**
 * Coats a badge unlocks that its leader is never seen in.
 *
 * A leader wanders in the sheets above; these are the other looks of
 * the same person, worth wearing and worth nothing to the chunk.
 * Giovanni's Let's Go coat is here because the gym he keeps is drawn
 * in his Fire Red one
 */
export const GYM_LEADER_PRIZE_CHARSETS: Partial<Record<number, string[]>> = {};

/**
 * The coat a Kanto leader is drawn in in Johto's era.
 *
 * It is the same gym years later, so it asks for the badge **and**
 * Johto's crown: a look from after that league means nothing to
 * somebody who has not taken it. Koga's gym has passed to his
 * daughter by then, so the Soul Badge pays Janine
 */
export const GYM_LEADER_LATER_CHARSETS: Partial<Record<number, string[]>> = {};

/**
 * The one pokemon a leader is remembered for, which stands in their
 * sixth slot however the other five roll. It is the mainline ace,
 * so several of them are below the band the other five are drawn
 * from: Brock's Onix is a middle stage now that a Steelix exists,
 * and he brings it anyway
 */
export const GYM_LEADER_SIGNATURES: Record<number, Species> = {};

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), LEADER), leadersFile))) {
  const where = `gym-leaders.yaml: ${name}`;
  const leader = idOf<GymLeader>(GYM_LEADER_IDS, name, where);

  GYM_LEADERS.push(leader);
  GYM_LEADER_TYPES[leader] = idOf<Types>(TYPE_IDS, written.type, where);
  GYM_LEADER_BADGES[leader] = idOf<Awards>(AWARD_IDS, written.badge, where);
  GYM_LEADER_CHARSETS[leader] = written.sheets;
  GYM_LEADER_SIGNATURES[leader] = idOf<Species>(SPECIES_IDS, written.signature, where);
  if (written.prize != null) {
    GYM_LEADER_PRIZE_CHARSETS[leader] = written.prize;
  }
  if (written.later != null) {
    GYM_LEADER_LATER_CHARSETS[leader] = written.later;
  }
}
GYM_LEADERS.sort((one, two) => one - two);

for (const [name, title] of Object.entries(v.parse(v.record(v.string(), v.string()), namesFile))) {
  GYM_LEADER_NAMES[idOf<GymLeader>(GYM_LEADER_IDS, name, `text/en/gym-leaders.yaml: ${name}`)] =
    title;
}

// Every leader the enum has is written down, so none stands nameless or bare
for (const [name, leader] of Object.entries(GYM_LEADER_IDS)) {
  if (!Object.hasOwn(GYM_LEADER_TYPES, leader) || !Object.hasOwn(GYM_LEADER_NAMES, leader)) {
    throw new Error(`${name} needs a record in gym-leaders.yaml and a name in text/en`);
  }
}

/**
 * Which leaders keep the gyms of each biome, in the order the chunk's
 * own fixture roll picks from. Every region's leaders share those
 * countries, so the list per biome holds all of them
 */
export const BIOME_GYM_LEADERS: Record<number, GymLeader[]> = {};

for (const [name, leaders] of Object.entries(
  v.parse(v.record(v.string(), v.array(v.string())), biomesFile),
)) {
  const where = `biome-gym-leaders.yaml: ${name}`;

  BIOME_GYM_LEADERS[idOf<Biome>(BIOME_IDS, name, where)] = idsOf<GymLeader>(
    GYM_LEADER_IDS,
    leaders,
    where,
  );
}

/**
 * The machine a beaten leader hands over: one of the TMs of their own
 * type, rolled by the caller's draw. Null only if a type somehow
 * teaches nothing
 */
export function rollGymMachine(leader: GymLeader, random: () => number): Items | null {
  const type = GYM_LEADER_TYPES[leader];
  const moves: Moves[] = [];

  for (const move of getTeachableMoves()) {
    if (getMoveData(move).type === type) {
      moves.push(move);
    }
  }
  const move = moves.at(Math.floor(random() * moves.length));

  return move == null ? null : getMachineItem(move);
}
