import { MAX_LEVEL } from '../../data/constants/levels';
import {
  CHAMPION_NAMES,
  ELITE_MEMBER_NAMES,
  GYM_LEADER_NAMES,
  LEGEND_NAMES,
} from '../../data/overworld/experts';
import Landmark from '../../data/overworld/landmark';
import Npc, { npcSheet } from '../../data/overworld/npc';
import { bossName, executiveName, gruntName } from '../../data/overworld/syndicate';
import { TRAINER_NAMES, TYPE_TRAINER_LEVELS } from '../../data/overworld/trainers';
import type ChunkSnapshot from '../chunk-snapshot';
import { RocketRank } from '../chunk-snapshot';

/**
 * A level band rather than one level: every pokemon rolls its own
 * inside it off its trait value, so a party has a spread and the
 * fight is still about what the player brought
 */
export type LevelBand = [minimum: number, maximum: number];

/** What level each rank fields, and who a stop puts up */
/**
 * The ladder the league fights on: a gym leader takes on challengers
 * who have beaten the road, the Elite Four stand above them, and the
 * Champion above all of it
 */
export const GYM_PARTY_LEVELS: LevelBand = [45, 65];
export const ELITE_PARTY_LEVELS: LevelBand = [65, 85];
export const CHAMPION_PARTY_LEVELS: LevelBand = [85, 100];

/**
 * And the one above the league, which is not a band at all: a legend
 * fields six of the ceiling, so the only question their fight asks is
 * what the challenger brought
 */
export const LEGEND_PARTY_LEVELS: LevelBand = [MAX_LEVEL, MAX_LEVEL];

/**
 * And a Frontier Brain's, which is a legend's for the same reason:
 * the house fields three rather than six, so nothing about the party
 * grades the fight and the ceiling is the honest answer
 */
export const FRONTIER_PARTY_LEVELS: LevelBand = [MAX_LEVEL, MAX_LEVEL];

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
  if (rank === RocketRank.Boss) {
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
  legend = false,
): LevelBand {
  if (landmark === Landmark.GymLeader) {
    return GYM_PARTY_LEVELS;
  }
  if (landmark === Landmark.EliteFour) {
    return ELITE_PARTY_LEVELS;
  }
  if (landmark === Landmark.Champion) {
    return legend ? LEGEND_PARTY_LEVELS : CHAMPION_PARTY_LEVELS;
  }
  if (landmark === Landmark.FrontierBrain) {
    return FRONTIER_PARTY_LEVELS;
  }
  if (landmark === Landmark.Trainer && trainer != null) {
    return trainer;
  }
  return rocketPartyLevels(rank);
}

/**
 * What beating one pays: a purse rolled in a range rather than a flat
 * fee, so a stop is worth walking to and no two wins feel quite alike
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
    // Kept on the battle row, so a fight read back afterwards still
    // names the team that was standing there
    const syndicate = snapshot.getSyndicate();
    const executive = snapshot.getRocketExecutive(cell);

    if (snapshot.isRocketBoss(cell)) {
      return named(bossName(syndicate));
    }
    return named(executive == null ? gruntName(syndicate) : executiveName(syndicate, executive));
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
    const legend = snapshot.getLegend(cell);

    if (legend != null) {
      return named(LEGEND_NAMES[legend]);
    }

    const champion = snapshot.getChampion(cell);

    return named(champion == null ? null : CHAMPION_NAMES[champion]);
  }
  return null;
}
