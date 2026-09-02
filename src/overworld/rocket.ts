import { SHADOW_FRIENDSHIP } from '../data/constants/friendship';
import AleaRNG from '../core/alea';
import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth } from '../auth/health';
import { Stats } from '../data/constants/stats';
import { defaultSlots } from '../data/constants/slots';
import Abilities from '../data/ids/abilities';
import Landmark from '../data/overworld/landmark';
import { CHAMPION_NAMES, ELITE_MEMBER_NAMES, GYM_LEADER_NAMES } from '../data/overworld/experts';
import Npc, {
  GIOVANNI_NAME,
  NPC_NAMES,
  ROCKET_EXECUTIVE_NAMES,
  npcSheet,
} from '../data/overworld/npc';
import { TRAINER_NAMES, TYPE_TRAINER_LEVELS } from '../data/overworld/trainers';
import type ChunkSnapshot from './chunk-snapshot';
import { RocketRank, type Spawn } from './chunk-snapshot';
import deriveEncounter, { EncounterType, deriveSize } from './encounter';
import { BOSS_ALLIANCE, PLAYER_ALLIANCE } from './raid';

/**
 * The Team Rocket stop: a grunt who bars a cell for the window and
 * fights whoever accepts.
 *
 * It is a trainer battle rather than a raid — three pokemon a side,
 * nobody flagged as a boss, and the party is the player's own — but
 * everything under it is the same machinery: the grunt's team is
 * frozen into snapshots exactly as a player's is, and the fight runs
 * from the battle id like any other.
 */

/**
 * A level band rather than one level: every pokemon rolls its own
 * inside it off its trait value, so a party has a spread and the
 * fight is still about what the player brought
 */
export type LevelBand = [minimum: number, maximum: number];

/**
 * The ladder the league fights on: a gym leader takes on challengers
 * who have beaten the road, the Elite Four stand above them, and the
 * Champion above all of it
 */
export const GYM_PARTY_LEVELS: LevelBand = [45, 65];
export const ELITE_PARTY_LEVELS: LevelBand = [65, 85];
export const CHAMPION_PARTY_LEVELS: LevelBand = [85, 100];

/**
 * And the ladder Team Rocket fights on, which is read off the other
 * two rather than picked apart from them. A grunt is a thief with a
 * roadside party and fights at a roadside trainer's level; an
 * executive stands where the Elite Four do; and the boss stands where
 * a Champion does, which is what one window in sixty-four should be
 * worth walking into
 */
export const ROCKET_PARTY_LEVELS: LevelBand = TYPE_TRAINER_LEVELS;
export const EXECUTIVE_PARTY_LEVELS: LevelBand = ELITE_PARTY_LEVELS;
export const GIOVANNI_PARTY_LEVELS: LevelBand = CHAMPION_PARTY_LEVELS;

/** The band a stop's party fights in, by whose party it is */
export function rocketPartyLevels(rank: RocketRank): LevelBand {
  if (rank === RocketRank.Giovanni) {
    return GIOVANNI_PARTY_LEVELS;
  }
  return rank === RocketRank.Executive ? EXECUTIVE_PARTY_LEVELS : ROCKET_PARTY_LEVELS;
}

/**
 * The band any stop's party fights in, keyed by the landmark it
 * stands on. Everybody fields 6 now, so nothing about the party says
 * what the fight is: the league is told by its landmark, Team Rocket
 * by the rank standing there, and a duelling trainer's band is their
 * class', which the caller passes in
 */
export function stopPartyLevels(
  landmark: Landmark,
  rank: RocketRank,
  trainer?: LevelBand,
): LevelBand {
  if (landmark === Landmark.GymLeader) {
    return GYM_PARTY_LEVELS;
  }
  if (landmark === Landmark.EliteFour) {
    return ELITE_PARTY_LEVELS;
  }
  if (landmark === Landmark.Champion) {
    return CHAMPION_PARTY_LEVELS;
  }
  if (landmark === Landmark.Trainer && trainer != null) {
    return trainer;
  }
  return rocketPartyLevels(rank);
}

/**
 * What beating a grunt or a duelling trainer pays: a purse rolled in
 * this range rather than a flat fee, so a stop is worth walking to
 * and no two wins feel quite alike
 */
/**
 * Who is standing at a fighting landmark, in a name and a face.
 *
 * It is derived rather than written down, the way everything about a
 * chunk is: the landmark says what sort of person, the window's rolls
 * say which one, and the coat they are wandering in is the picture.
 *
 * The greeting and the stakes a challenge dialog puts are that
 * dialog's copy and stay there; this is the half a battle record has
 * to keep, since a fight read back a week later has no window to ask
 */
export function stopChallenger(
  snapshot: ChunkSnapshot,
  cell: number,
): { name: string; sprite: string } | null {
  const landmark = snapshot.chunk.getLandmarkCells().get(cell);

  if (landmark == null) {
    return null;
  }

  const sprite = snapshot.getWandererCoats().get(cell) ?? npcSheet(Npc.RocketGrunt);
  const named = (name: string | null): { name: string; sprite: string } | null =>
    name == null ? null : { name, sprite };

  if (landmark === Landmark.TeamRocket) {
    const executive = snapshot.getRocketExecutive(cell);

    if (snapshot.isRocketBoss(cell)) {
      return named(GIOVANNI_NAME);
    }
    return named(
      executive == null ? NPC_NAMES[Npc.RocketGrunt] : ROCKET_EXECUTIVE_NAMES[executive],
    );
  }
  if (landmark === Landmark.Trainer) {
    const trainer = snapshot.getTrainerClass(cell);

    return named(trainer == null ? null : TRAINER_NAMES[trainer]);
  }
  if (landmark === Landmark.GymLeader) {
    const leader = snapshot.getGymLeader(cell);

    return named(leader == null ? null : GYM_LEADER_NAMES[leader]);
  }
  if (landmark === Landmark.EliteFour) {
    const member = snapshot.getEliteMember(cell);

    return named(member == null ? null : ELITE_MEMBER_NAMES[member]);
  }
  if (landmark === Landmark.Champion) {
    const champion = snapshot.getChampion(cell);

    return named(champion == null ? null : CHAMPION_NAMES[champion]);
  }
  return null;
}

export const STOP_GOLD_MIN = 1000;
export const STOP_GOLD_MAX = 10000;

/**
 * And the boss' purse: one win in sixty-four windows should fund
 * something, not buy a round of potions
 */
export const GIOVANNI_GOLD_MIN = 10000;
export const GIOVANNI_GOLD_MAX = 50000;

/**
 * The purse a beaten stop pays, seeded so each winner's roll is their
 * own and asking again answers the same. `boss` draws from the top
 * range: Giovanni's, and the Champion's — the two rarest wins a walk
 * can land
 */
export function rollStopGold(seed: string, boss: boolean): number {
  const rng = new AleaRNG(seed);
  const floor = boss ? GIOVANNI_GOLD_MIN : STOP_GOLD_MIN;
  const ceiling = boss ? GIOVANNI_GOLD_MAX : STOP_GOLD_MAX;

  return floor + Math.floor(rng.random() * (ceiling - floor + 1));
}

/**
 * Whether a stop's purse is a boss purse: Giovanni on a Team Rocket
 * cell, or the Champion on their own
 */
export function isBossPurse(landmark: Landmark, rank: RocketRank): boolean {
  return (
    landmark === Landmark.Champion ||
    (landmark === Landmark.TeamRocket && rank === RocketRank.Giovanni)
  );
}

/**
 * The level the pokemon a beaten grunt drops comes at. It is fixed,
 * so the prize is the same for everyone who put the same grunt down —
 * and low, because what is being handed over is a commoner taken off
 * a thief, not a raid boss' legendary
 */
export const ROCKET_REWARD_LEVEL = 10;

/**
 * The alliance the grunt's party fights under — the side opposite the
 * player, the same number a raid boss takes. Nothing marks it as a
 * boss, so a fight that ends with nobody standing is a draw rather
 * than a win
 */
export const ROCKET_ALLIANCE = BOSS_ALLIANCE;

export { PLAYER_ALLIANCE };

function zeroEffortValues(): Record<Stats, number> {
  return {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
}

/**
 * One of the stop's pokemon as a catch snapshot, so the party is
 * fielded from the same shape a player's is. A grunt's is a shadow —
 * that is what a Team Rocket pokemon is — where a duelling trainer's
 * is its ordinary self; either rolls its level inside the band it was
 * staged with rather than the one its species would have taken. Its
 * IVs, nature, gender, ability and moves are the ones the spawn tuple
 * gives, so no two stops field the same three pokemon
 */
export function createRocketSnapshot(
  snapshot: ChunkSnapshot,
  spawn: Spawn,
  shadow = true,
  levels: LevelBand = ROCKET_PARTY_LEVELS,
): CatchSnapshot {
  const fielded = deriveEncounter(snapshot, spawn, undefined, {
    type: EncounterType.Rocket,
    levels,
    shadow,
  });
  const size = deriveSize(fielded.species, fielded.traitValue);
  const abilities = shadow ? [fielded.ability, Abilities.Shadow] : [fielded.ability];

  return {
    // A stop's pokemon stands for no catch record
    caught: '',
    species: fielded.species,
    level: fielded.level,
    ivs: fielded.ivs,
    effortValues: zeroEffortValues(),
    nature: fielded.nature,
    gender: fielded.gender,
    height: size.height,
    weight: size.weight,
    // A stop's pokemon never sparkles: the prize is what the fight
    // pays, not what it fields
    shiny: false,
    shadow,
    moves: fielded.moves,
    // A stop buys no PP Ups: what it fields is what the roll gave it
    movePoints: {},
    abilities,
    items: [],
    slots: defaultSlots(abilities),
    // A stop's pokemon has no record to have been hurt on: it is
    // made for this fight and arrives whole
    health: getMaxHealth({
      species: fielded.species,
      level: fielded.level,
      ivs: fielded.ivs,
      effortValues: zeroEffortValues(),
    }),
    // A shadow has been made to fight and nothing else
    friendship: SHADOW_FRIENDSHIP,
    statuses: 0,
  };
}

/**
 * The stop's whole party, weakest first: shadows for a grunt or the
 * boss, ordinary pokemon for a duelling trainer or a league seat. The
 * band defaults to a grunt's, for the callers that predate the
 * league; theirs is the landmark's to fix
 */
export function createRocketParty(
  snapshot: ChunkSnapshot,
  spawns: Spawn[],
  shadow = true,
  levels: LevelBand = ROCKET_PARTY_LEVELS,
): CatchSnapshot[] {
  return spawns.map((spawn) => createRocketSnapshot(snapshot, spawn, shadow, levels));
}
