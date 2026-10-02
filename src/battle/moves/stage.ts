import { AttackPriority } from '../../core/event-emitter';
import { MAX_STAGE, MIN_STAGE, Stages } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { MoveAffects, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { USELESS_PENALTY } from '../ai/score';
import {
  BattleEvents,
  type EffectCause,
  EffectType,
  type MoveTarget,
  MoveTargetType,
} from '../events';
import resolveMoveTargets from '../mechanics/move/targeting';
import type Unit from '../unit';

type StageMovesConfig = { [key in Moves]?: number };

function createStageMove(stage: Stages, config: StageMovesConfig) {
  return (battle: Battle) => {
    battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
      let target = event.source;
      if (event.target.type === MoveTargetType.Unit) {
        target = event.target.unit;
      }
      const move = event.move;
      if (move in config) {
        target.addStage(stage, config[move] ?? 0, {
          type: EffectType.Move,
          unit: event.source,
          move: event.move,
        });
      }
    });
  };
}

const STAGE_MOVE_GROUPS: [Stages, StageMovesConfig][] = [
  [
    Stages.Attack,
    {
      [Moves.Growl]: -1,
      [Moves.SwordsDance]: 2,
      [Moves.Meditate]: 1,
      [Moves.Sharpen]: 1,
      [Moves.Charm]: -2,
      // The target is flattered into swinging harder while it is too
      // confused to aim
      [Moves.Swagger]: 2,
      [Moves.Howl]: 1,
      [Moves.BulkUp]: 1,
      [Moves.DragonDance]: 1,
      [Moves.Tickle]: -1,
      [Moves.FeatherDance]: -2,
      [Moves.Memento]: -2,
      [Moves.HoneClaws]: 1,
      [Moves.Coil]: 1,
      [Moves.ShellSmash]: 2,
      [Moves.WorkUp]: 1,
      [Moves.ShiftGear]: 1,
      [Moves.NobleRoar]: -1,
      [Moves.PlayNice]: -1,
      [Moves.BabyDollEyes]: -1,
    },
  ],
  [
    Stages.SpecialAttack,
    {
      [Moves.Growth]: 1,
      [Moves.TailGlow]: 3,
      [Moves.NastyPlot]: 2,
      [Moves.CalmMind]: 1,
      // Flattery: the target is talked into leaning on a stat it
      // cannot aim with
      [Moves.Flatter]: 1,
      [Moves.Memento]: -2,
      [Moves.QuiverDance]: 1,
      [Moves.ShellSmash]: 2,
      [Moves.WorkUp]: 1,
      [Moves.NobleRoar]: -1,
      [Moves.Confide]: -1,
      [Moves.EerieImpulse]: -2,
    },
  ],
  [
    Stages.SpecialDefense,
    {
      [Moves.Amnesia]: 2,
      [Moves.DefendOrder]: 1,
      [Moves.CalmMind]: 1,
      [Moves.CosmicPower]: 1,
      [Moves.Stockpile]: 1,
      [Moves.Charge]: 1,
      [Moves.MetalSound]: -2,
      [Moves.FakeTears]: -2,
      [Moves.QuiverDance]: 1,
      [Moves.ShellSmash]: -1,
      [Moves.AromaticMist]: 1,
    },
  ],
  [
    Stages.Defense,
    {
      [Moves.Leer]: -1,
      [Moves.DefendOrder]: 1,
      [Moves.TailWhip]: -1,
      [Moves.Withdraw]: 1,
      [Moves.Harden]: 1,
      [Moves.Screech]: -2,
      [Moves.DefenseCurl]: 1,
      [Moves.Barrier]: 2,
      [Moves.AcidArmor]: 2,
      [Moves.IronDefense]: 2,
      [Moves.BulkUp]: 1,
      [Moves.CosmicPower]: 1,
      [Moves.Stockpile]: 1,
      [Moves.Tickle]: -1,
      [Moves.Coil]: 1,
      [Moves.ShellSmash]: -1,
      [Moves.CottonGuard]: 3,
    },
  ],
  [
    Stages.Speed,
    {
      [Moves.StringShot]: -2,
      [Moves.RockPolish]: 2,
      [Moves.Agility]: 2,
      [Moves.ScaryFace]: -2,
      [Moves.CottonSpore]: -2,
      [Moves.DragonDance]: 1,
      [Moves.Autotomize]: 2,
      [Moves.QuiverDance]: 1,
      [Moves.ShellSmash]: 2,
      [Moves.ShiftGear]: 2,
    },
  ],
  [
    Stages.Accuracy,
    {
      [Moves.Flash]: -1,
      [Moves.SandAttack]: -1,
      [Moves.SmokeScreen]: -1,
      [Moves.Kinesis]: -1,
      [Moves.HoneClaws]: 1,
      [Moves.Coil]: 1,
    },
  ],
  [
    Stages.Evasion,
    {
      [Moves.DoubleTeam]: 1,
      [Moves.Minimize]: 2,
      [Moves.SweetScent]: -2,
      [Moves.Defog]: -1,
    },
  ],
];

/**
 * Whether the two are on the same side of the field
 */
function isAlly(one: Unit, other: Unit): boolean {
  return one !== other && one.team.alliance === other.team.alliance;
}

export interface StageMoveEffect {
  stage: Stages;
  value: number;
}

/**
 * Every stage change a move applies, empty for a move that applies
 * none. All of them rather than the first: a Shell Smash is three
 * rises and two drops, and a pinned Attack says nothing about the rest
 */
export function getStageMoveEffects(move: Moves): StageMoveEffect[] {
  const effects: StageMoveEffect[] = [];

  for (const [stage, config] of STAGE_MOVE_GROUPS) {
    const value = config[move];

    if (value != null) {
      effects.push({ stage, value });
    }
  }
  return effects;
}

/** The first stage change a move applies, for what shows only one */
export function getStageMoveEffect(move: Moves): StageMoveEffect | undefined {
  return getStageMoveEffects(move)[0];
}

/**
 * A stat drop aimed at the player's own side is worth casting on one
 * pokemon only: the one whose Contrary turns every drop into a rise.
 * Anything else on that side is being made worse for nothing, so the
 * AI is told so rather than being left to weigh it
 */
function setupFriendlyDrops(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      !event.usable ||
      event.target.type !== MoveTargetType.Unit ||
      !isAlly(event.source, event.target.unit)
    ) {
      return;
    }

    let drops = false;

    for (const effect of getStageMoveEffects(event.move)) {
      if (effect.value < 0) {
        drops = true;
      }
    }

    if (drops) {
      event.usable = event.target.unit.hasAbility(Abilities.Contrary);
    }
  });
}

/**
 * Who a stage move changes: the unit it was aimed at, everybody a move
 * cast at nobody fans out to (Growl), or else the caster itself
 */
function stageReceivers(battle: Battle, source: Unit, move: Moves, target: MoveTarget): Unit[] {
  if (target.type === MoveTargetType.Unit) {
    return [target.unit];
  }

  const data = getMoveData(move);
  const receivers: Unit[] = [];

  if (target.type === MoveTargetType.None && data.affects & MoveAffects.Unit) {
    for (const reached of resolveMoveTargets(battle, source, target, data.target, data.affects)) {
      if (reached.type === MoveTargetType.Unit) {
        receivers.push(reached.unit);
      }
    }
  }
  return receivers.length > 0 ? receivers : [source];
}

/**
 * Whether any change the move is cast for would still move a stage on
 * this receiver: a rise on the caster's side, a drop on the other.
 * Shell Smash's drops are its price. A move with none of those
 * (Swagger's gift) is judged on everything it does
 */
function stageMoves(
  receiver: Unit,
  source: Unit,
  effects: StageMoveEffect[],
  cause: EffectCause,
): boolean {
  const friendly = receiver.team.alliance === source.team.alliance;
  let wanted = 0;

  for (const effect of effects) {
    if (effect.value > 0 === friendly) {
      wanted += 1;
    }
  }

  for (const effect of effects) {
    if (wanted > 0 && effect.value > 0 !== friendly) {
      continue;
    }

    // Speculative: the AI is weighing the move, not casting it. A
    // Contrary turns the change round, so the direction is the one the
    // receiver would really take
    const change = receiver.resolveStageChange(effect.stage, effect.value, cause);
    const current = receiver.stages[effect.stage];
    const pinned = change > 0 ? current >= MAX_STAGE : current <= MIN_STAGE;

    if (change !== 0 && !pinned && (wanted === 0 || change > 0 === friendly)) {
      return true;
    }
  }
  return false;
}

/**
 * The stage moves that do something besides: a weight shed, a charge
 * held, a curl or a shrink remembered, hazards blown away, a faint, a
 * stockpile, a confusion. A stage already as far as it goes leaves
 * the rest of them worth casting, so they are only marked down
 */
const MORE_THAN_STAGES = new Set<Moves>([
  Moves.Autotomize,
  Moves.Charge,
  Moves.DefenseCurl,
  Moves.Defog,
  Moves.Flatter,
  Moves.Memento,
  Moves.Minimize,
  Moves.Stockpile,
  Moves.Swagger,
]);

/** Whether casting the move at this target would still move a stage on somebody it reaches */
function movesAnyStage(battle: Battle, source: Unit, move: Moves, target: MoveTarget): boolean {
  const cause = { type: EffectType.Move, move, unit: source } as const;
  const effects = getStageMoveEffects(move);

  for (const receiver of stageReceivers(battle, source, move, target)) {
    if (stageMoves(receiver, source, effects, cause)) {
      return true;
    }
  }
  return false;
}

export default function setupStageMoves(battle: Battle): void {
  setupFriendlyDrops(battle);

  for (const [stage, config] of STAGE_MOVE_GROUPS) {
    createStageMove(stage, config)(battle);
  }

  // A stage that will not move is a cast spent changing nothing. It is
  // pinned at the end it is being pushed towards, or something is
  // holding it: a Mist over the far side, a Clear Body under the hand.
  // The engine is asked about the second rather than the AI keeping
  // its own list of what blocks a stage
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      getStageMoveEffects(event.move).length > 0 &&
      !movesAnyStage(battle, event.source, event.move, event.target)
    ) {
      event.score -= USELESS_PENALTY;
    }
  });

  // And a move that does nothing but move stages is not offered at all
  // where none would move: aimed elsewhere it still might, so the AI
  // looks for that target rather than settling for a dead cast here
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      event.usable &&
      !MORE_THAN_STAGES.has(event.move) &&
      getStageMoveEffects(event.move).length > 0 &&
      !movesAnyStage(battle, event.source, event.move, event.target)
    ) {
      event.usable = false;
    }
  });
}
