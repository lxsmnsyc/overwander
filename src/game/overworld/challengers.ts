import { AWARD_NAMES } from '../../data/awards';
import {
  CHAMPION_GREETINGS,
  CHAMPION_HONORS,
  CHAMPION_LEAGUES,
  CHAMPION_NAMES,
  CHAMPION_TITLES,
  type Champion,
  ELITE_MEMBER_LEAGUES,
  ELITE_MEMBER_NAMES,
  ELITE_MEMBER_QUOTES,
  type EliteMember,
  FRONTIER_BRAIN_NAMES,
  FRONTIER_BRAIN_RULES,
  FRONTIER_BRAIN_SYMBOLS,
  FRONTIER_BRAIN_TITLES,
  FRONTIER_FACILITY_NAMES,
  FRONTIER_GREETINGS,
  FRONTIER_RENTAL_OFFER,
  FRONTIER_TIME_TURNS,
  type FrontierBrain,
  FrontierRule,
  GYM_LEADER_BADGES,
  GYM_LEADER_NAMES,
  GYM_LEADER_QUOTES,
  LEGEND_GREETINGS,
  LEGEND_HONORS,
  LEGEND_NAMES,
  PIKE_CURTAINS,
  frontierTeamSize,
  getEliteBadges,
} from '../../data/overworld/experts';
import Landmark from '../../data/overworld/landmark';
import { EXECUTIVE_HONORS, EXECUTIVE_QUOTES } from '../../data/overworld/npc';
import {
  SYNDICATE_BOSS_HONORS,
  SYNDICATE_BOSS_QUOTES,
  SYNDICATE_GRUNT_HONORS,
  SYNDICATE_GRUNT_QUOTES,
  SYNDICATE_NAMES,
  bossName,
  executiveName,
  gruntName,
} from '../../data/overworld/syndicate';
import { RocketRank } from '../../overworld/chunk-snapshot';
import type ChunkSnapshot from '../../overworld/chunk-snapshot';
import {
  CHAMPION_PARTY_LEVELS,
  ELITE_PARTY_LEVELS,
  FRONTIER_PARTY_LEVELS,
  GYM_PARTY_LEVELS,
  LEGEND_PARTY_LEVELS,
  type LevelBand,
  rocketPartyLevels,
} from '../../overworld/stop';
import { TRAINER_QUOTES, trainerLevels, trainerNameIn } from '../../data/overworld/trainers';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * A named challenger above the rank and file: a duelling trainer's
 * class, a gym leader, one of the Elite Four, or the Champion. The
 * name titles the dialog, the band prices the lineup, and the stake
 * line says what a win earns
 */
export interface StopChallenge {
  name: string;
  levels: LevelBand;
  greeting: string;
  /** What beating them pays, in a line. Losing costs nothing but the fight */
  wins: string;
  /** A Frontier facility's house rule, said before the fight */
  rule?: string;
  /**
   * The most this fight takes, where the house sets it: a Frontier
   * facility is three a side. Absent everywhere else, which is the
   * game's own six
   */
  bring?: number;
  /**
   * Whether the house lends the party rather than taking the
   * player's. The six on offer are drawn off the stop, so the dialog
   * lays them out itself and the picks are places in that list
   */
  rented?: boolean;
  /**
   * Whether the house has named nobody yet. The Dome draws its three
   * against the party that walks in, so there is no lineup to lay out
   * until the challenge is taken
   */
  unseen?: boolean;
}

/** A band said the way a lineup reads it: "levels 45-65" */
export function saidLevels([lowest, highest]: LevelBand): string {
  return m.challenger_levels({ lowest, highest });
}

/**
 * The locked message at a champion's seat, which names what it asks to
 * see beaten first
 */
export function championGate(champion: Champion, who: string): string {
  return m.interact_gate_champion({
    who,
    count: CHAMPION_HONORS[champion].length,
    league: CHAMPION_LEAGUES[champion],
  });
}

/**
 * The house rule, said first, because it is the whole of what makes a
 * Frontier fight different from the Champion's. The Tower has no rule
 * at all, so it says nothing
 */
const FRONTIER_RULE_TERMS: Record<FrontierRule, () => string> = {
  [FrontierRule.None]: () => '',
  [FrontierRule.Bare]: () => m.challenger_rule_bare(),
  [FrontierRule.Timed]: () => m.challenger_rule_timed({ turns: FRONTIER_TIME_TURNS }),
  [FrontierRule.Curtained]: () => m.challenger_rule_curtained({ rooms: PIKE_CURTAINS.length }),
  [FrontierRule.Rented]: () => m.challenger_rule_rented({ offer: FRONTIER_RENTAL_OFFER }),
  [FrontierRule.Natured]: () => m.challenger_rule_natured(),
  [FrontierRule.Countered]: () => m.challenger_rule_countered(),
  [FrontierRule.Rolled]: () => m.challenger_rule_rolled(),
  [FrontierRule.Unhealed]: () => m.challenger_rule_unhealed(),
  [FrontierRule.Singled]: () => m.challenger_rule_singled(),
};

/** The locked message at a Brain's house, which asks for the crown of its region */
export function frontierGate(brain: FrontierBrain, who: string): string {
  return m.interact_gate_frontier({ who, title: AWARD_NAMES[FRONTIER_BRAIN_TITLES[brain]] });
}

/**
 * The locked message at an elite's seat. Each seat asks for its own
 * league's gyms and no more, Bruno's two included
 */
export function eliteGate(member: EliteMember, who: string): string {
  return m.interact_gate_elite({
    who,
    count: getEliteBadges(member).length,
    league: ELITE_MEMBER_LEAGUES[member],
  });
}

/**
 * The named challenger a fighting landmark stages, or null for the
 * rank and file — a Team Rocket grunt, whom the dialog names itself.
 * The name, the levels and what a win pays are the dialog's copy; who
 * actually stands there is the chunk's roll
 */
export default function challengerOf(
  snapshot: ChunkSnapshot,
  landmark: Landmark,
  cell: number,
): StopChallenge | null {
  if (landmark === Landmark.TeamRocket) {
    const rank = snapshot.getRocketRank(cell);

    if (rank == null) {
      return null;
    }

    const executive = snapshot.getRocketExecutive(cell);
    const levels = rocketPartyLevels(rank);
    // Which of the three keeps this cell is the biome's answer, so
    // every line below names the team standing here
    const syndicate = snapshot.getSyndicate();
    const team = SYNDICATE_NAMES[syndicate];

    if (rank === RocketRank.Boss) {
      const boss = bossName(syndicate);

      return {
        name: boss,
        levels,
        greeting: m.challenger_boss_greeting({
          name: boss,
          quote: SYNDICATE_BOSS_QUOTES[syndicate],
        }),
        wins: m.challenger_boss_wins({ award: AWARD_NAMES[SYNDICATE_BOSS_HONORS[syndicate]] }),
      };
    }
    if (executive != null) {
      const name = executiveName(syndicate, executive);

      return {
        name,
        levels,
        greeting: m.challenger_executive_greeting({
          name,
          team,
          quote: EXECUTIVE_QUOTES[executive],
        }),
        wins: m.challenger_executive_wins({ award: AWARD_NAMES[EXECUTIVE_HONORS[executive]] }),
      };
    }

    const name = gruntName(syndicate);

    return {
      name,
      levels,
      greeting: m.challenger_grunt_greeting({ name, quote: SYNDICATE_GRUNT_QUOTES[syndicate] }),
      wins: m.challenger_grunt_wins({ award: AWARD_NAMES[SYNDICATE_GRUNT_HONORS[syndicate]] }),
    };
  }
  if (landmark === Landmark.Trainer) {
    const trainer = snapshot.getTrainerClass(cell);

    if (trainer == null) {
      return null;
    }

    const name = trainerNameIn(trainer, snapshot.getWandererCoats().get(cell));
    const levels = trainerLevels(trainer);

    return {
      name,
      levels,
      greeting: m.challenger_trainer_greeting({ name, quote: TRAINER_QUOTES[trainer] }),
      wins: m.challenger_trainer_wins(),
    };
  }
  if (landmark === Landmark.GymLeader) {
    const leader = snapshot.getGymLeader(cell);

    if (leader == null) {
      return null;
    }

    const name = GYM_LEADER_NAMES[leader];
    const badge = AWARD_NAMES[GYM_LEADER_BADGES[leader]];

    return {
      name,
      levels: GYM_PARTY_LEVELS,
      greeting: m.challenger_gym_greeting({ name, quote: GYM_LEADER_QUOTES[leader] }),
      wins: m.challenger_gym_wins({ badge }),
    };
  }
  if (landmark === Landmark.EliteFour) {
    const member = snapshot.getEliteMember(cell);

    if (member == null) {
      return null;
    }

    const name = ELITE_MEMBER_NAMES[member];

    return {
      name,
      levels: ELITE_PARTY_LEVELS,
      greeting: m.challenger_elite_greeting({ name, quote: ELITE_MEMBER_QUOTES[member] }),
      wins: m.challenger_elite_wins(),
    };
  }
  if (landmark === Landmark.Champion) {
    const legend = snapshot.getLegend(cell);

    if (legend != null) {
      return {
        name: LEGEND_NAMES[legend],
        levels: LEGEND_PARTY_LEVELS,
        greeting: LEGEND_GREETINGS[legend],
        wins: m.challenger_legend_wins({ award: AWARD_NAMES[LEGEND_HONORS[legend]] }),
      };
    }

    const champion = snapshot.getChampion(cell);

    if (champion == null) {
      return null;
    }

    const name = CHAMPION_NAMES[champion];

    return {
      name,
      levels: CHAMPION_PARTY_LEVELS,
      greeting: CHAMPION_GREETINGS[champion],
      wins: m.challenger_champion_wins({ title: AWARD_NAMES[CHAMPION_TITLES[champion]] }),
    };
  }
  if (landmark === Landmark.FrontierBrain) {
    const brain = snapshot.getFrontierBrain(cell);

    if (brain == null) {
      return null;
    }

    const name = FRONTIER_BRAIN_NAMES[brain];
    const [silver] = FRONTIER_BRAIN_SYMBOLS[brain];

    return {
      name,
      levels: FRONTIER_PARTY_LEVELS,
      bring: frontierTeamSize(FRONTIER_BRAIN_RULES[brain]),
      rented: FRONTIER_BRAIN_RULES[brain] === FrontierRule.Rented,
      unseen:
        FRONTIER_BRAIN_RULES[brain] === FrontierRule.Countered ||
        FRONTIER_BRAIN_RULES[brain] === FrontierRule.Singled,
      greeting: m.challenger_frontier_greeting({
        name,
        facility: FRONTIER_FACILITY_NAMES[brain],
        quote: FRONTIER_GREETINGS[brain],
      }),
      wins: m.challenger_frontier_wins({ symbol: AWARD_NAMES[silver] }),
      rule: FRONTIER_RULE_TERMS[FRONTIER_BRAIN_RULES[brain]]() || undefined,
    };
  }
  return null;
}
