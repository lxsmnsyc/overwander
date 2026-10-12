import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { Moves } from '../../../data/ids/moves';
import type Unit from '../../unit';
import { createCueAbility } from './__create';

/** The teammate whose better attacking stat stands highest */
function hardestHitter(holder: Unit): Unit | undefined {
  let found: Unit | undefined;
  let best = 0;

  for (const mate of holder.team.units) {
    if (mate === holder || !mate.alive) {
      continue;
    }

    const stat = Math.max(mate.checkStat(Stats.Attack, 0), mate.checkStat(Stats.SpecialAttack, 0));

    if (stat > best) {
      found = mate;
      best = stat;
    }
  }

  return found;
}

/** The teammate winding up with the most of its cast still to go */
function slowestWindUp(holder: Unit): Unit | undefined {
  let found: Unit | undefined;
  let longest = 0;

  for (const mate of holder.team.units) {
    const casting = mate.casting;

    if (mate === holder || !mate.alive || casting == null) {
      continue;
    }

    const left = casting.time.duration - casting.time.progress;

    if (left > longest) {
      found = mate;
      longest = left;
    }
  }

  return found;
}

/**
 * Galar's three starters, each playing for the team: the drummer lends
 * its strongest teammate a hand, the striker waves a teammate's move
 * through, and the sniper lights up what it hit for the rest to aim at
 */
const setupAbilities = [
  createCueAbility(Abilities.DrumCue, Types.Grass, Moves.HelpingHand, hardestHitter),
  createCueAbility(Abilities.KickCue, Types.Fire, Moves.AfterYou, slowestWindUp),
  createCueAbility(Abilities.ScopeCue, Types.Water, Moves.Spotlight, (_holder, target) =>
    target.alive ? target : undefined,
  ),
];

export default setupAbilities;
