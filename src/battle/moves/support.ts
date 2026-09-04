import { AttackPriority } from '../../core/event-emitter';
import { MAX_STAGE, Stages, Stats } from '../../data/constants/stats';
import { DamageFlags, Moves } from '../../data/ids/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type Unit from '../unit';

/**
 * Every stage one unit can copy off another
 */
const STAGES = [
  Stages.Attack,
  Stages.Defense,
  Stages.SpecialAttack,
  Stages.SpecialDefense,
  Stages.Speed,
  Stages.Evasion,
  Stages.Accuracy,
];

/**
 * What Belly Drum spends, and what it buys: half the user's health
 * for an Attack pinned at the top of the scale
 */
const DRUM_COST = 0.5;

/**
 * The party moves: what one unit does for itself, its side, or the
 * two of them together. They share a file because each is a few lines
 * over the same events, not because they share behaviour
 */
/** The most a Pain Split is worth for the health it is sharing */
const SHARE_BONUS = 5;

/** The most a Psych Up is worth for the stages it is copying */
const STAGE_COPY_CAP = 6;

/** What a unit has built up, drops counted against it */
function totalStages(unit: Unit): number {
  let total = 0;

  for (const stage of STAGES) {
    total += unit.stages[stage];
  }
  return total;
}

export default function setupSupportMoves(battle: Battle): void {
  function canDrum(unit: Unit): boolean {
    return (
      unit.health > unit.checkStat(Stats.HP, 0) * DRUM_COST &&
      unit.stages[Stages.Attack] < MAX_STAGE
    );
  }

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.BellyDrum) {
      event.usable = canDrum(event.source);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.BellyDrum) {
      return;
    }

    const source = event.source;
    const cause = { type: EffectType.Move, move: Moves.BellyDrum, unit: source } as const;

    if (!canDrum(source)) {
      source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    source.damage(
      cause,
      source,
      source.checkStat(Stats.HP, 0) * DRUM_COST,
      DamageFlags.Indirect | DamageFlags.Cost,
    );
    source.addStage(Stages.Attack, MAX_STAGE - source.stages[Stages.Attack], cause);
  });

  // Pain Split: both sides come out on the same share of health
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.PainSplit || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const source = event.source;
    const target = event.target.unit;
    const cause = { type: EffectType.Move, move: Moves.PainSplit, unit: source } as const;
    const split = (source.health + target.health) / 2;

    for (const unit of [source, target]) {
      const difference = split - unit.health;

      if (difference > 0) {
        source.heal(cause, unit, difference, 0);
      } else if (difference < 0) {
        source.damage(cause, unit, -difference, DamageFlags.Indirect | DamageFlags.Pure);
      }
    }
  });

  // It is only worth a cast to the unit that is worse off, and the
  // fuller the other one is the more there is to share: pointed at
  // the player's own side that is the healthiest teammate, which is
  // the one that can spare it
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.PainSplit || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (event.source.health >= target.health) {
      event.score -= USELESS_PENALTY;
      return;
    }

    const whole = Math.max(1, target.checkStat(Stats.HP, 0));

    event.score += Math.round(SHARE_BONUS * Math.min(1, target.health / whole));
  });

  // Psych Up copies whatever is worth copying, so what it is worth is
  // how much better the target's stages are than the user's own. On
  // the player's own side that picks the teammate who has built the
  // most, which is what makes it worth aiming there at all
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.PsychUp || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const gain = totalStages(event.target.unit) - totalStages(event.source);

    if (gain <= 0) {
      event.score -= USELESS_PENALTY;
      return;
    }

    event.score += Math.min(STAGE_COPY_CAP, gain);
  });

  // Psych Up: the target's stages, copied over the user's own
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.PsychUp || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const source = event.source;
    const cause = { type: EffectType.Move, move: Moves.PsychUp, unit: source } as const;

    for (const stage of STAGES) {
      const difference = event.target.unit.stages[stage] - source.stages[stage];

      if (difference !== 0) {
        source.addStage(stage, difference, cause);
      }
    }
  });

  // Heal Bell: the whole party is put right, the bench included
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.HealBell) {
      return;
    }

    const cause = { type: EffectType.Move, move: Moves.HealBell, unit: event.source } as const;

    for (const unit of event.source.team.units) {
      if (unit.alive) {
        unit.cure(cause);
      }
    }
  });

  // Nothing to clear is a cast spent on a sound nobody needed
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.HealBell) {
      return;
    }

    let carrying = false;

    for (const unit of event.source.team.units) {
      for (const status of MAJOR_STATUS_CONDITIONS) {
        if (unit.alive && unit.status[status] != null) {
          carrying = true;
        }
      }
    }

    if (!carrying) {
      event.score -= USELESS_PENALTY;
    }
  });
}
