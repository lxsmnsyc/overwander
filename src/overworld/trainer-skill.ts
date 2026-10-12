import type { CatchSnapshot } from '../auth/catch-snapshot';
import { BASIC_SKILL, GYM_SKILL, TOP_SKILL, type TrainerSkill } from '../battle/ai/skill';
import Abilities from '../data/ids/abilities';

/** The marks a fight adds to a pokemon, which say nothing about who raised it */
const MARKS = new Set<Abilities>([
  Abilities.Shadow,
  Abilities.Boss,
  Abilities.TotemAlly,
  Abilities.Alpha,
  Abilities.Noble,
]);

/**
 * How sharply a team is directed, read off the team itself so a replay
 * reads the same. A player's team and a raid boss get the best. A computer's is told
 * by how its party was outfitted: two abilities each is the Elite and
 * above, trained or geared is a gym leader or an Ace Trainer, and the
 * rest get the basic trainer
 */
/** What of a team the rank is read from */
export interface OutfittedTeam {
  player: string;
  catches: Pick<CatchSnapshot, 'abilities' | 'items' | 'effortValues'>[];
}

export default function skillOf(record: OutfittedTeam, boss: boolean): TrainerSkill {
  if (record.player !== '') {
    return TOP_SKILL;
  }
  if (boss) {
    return TOP_SKILL;
  }

  let abilities = 0;
  let raised = false;

  for (const snapshot of record.catches) {
    let ordinary = 0;

    for (const ability of snapshot.abilities) {
      if (!MARKS.has(ability)) {
        ordinary += 1;
      }
    }
    abilities = Math.max(abilities, ordinary);

    let effort = 0;

    for (const value of Object.values(snapshot.effortValues)) {
      effort += value;
    }
    raised ||= effort > 0 || snapshot.items.length > 0;
  }

  if (abilities >= 2) {
    return TOP_SKILL;
  }
  return raised ? GYM_SKILL : BASIC_SKILL;
}
